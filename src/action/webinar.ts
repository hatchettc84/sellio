"use server";

import { WebinarFormState } from "@/store/useWebinarStore";
import { revalidatePath } from "next/cache";
import { onAuthenticateUser } from "./auth";
import { WebinarStatusEnum } from "@prisma/client";
import { runTenantOperation } from "@/lib/tenant/auth";
import { updateAssistantForWebinar } from "./vapi";

export const createWebinar = async (formData: WebinarFormState) => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const user = await onAuthenticateUser();

      if (!user.user) {
        return { status: 401, message: "Unauthorized" };
      }

      const presenterId = user.user.id;

      // Validate required fields
      if (!formData.basicInfo.webinarName?.trim()) {
        return { status: 400, message: "Webinar name is required" };
      }

      if (!formData.basicInfo.date) {
        return { status: 400, message: "Webinar date is required" };
      }

      if (!formData.basicInfo.time?.trim()) {
        return { status: 400, message: "Webinar time is required" };
      }

      // Validate CTA type (required field in database)
      if (!formData.cta.ctaType) {
        return { status: 400, message: "CTA type is required" };
      }

      // Validate CTA label (required field)
      if (!formData.cta.ctaLabel?.trim()) {
        return { status: 400, message: "CTA label is required" };
      }

      // Validate tenant context
      if (!context.tenantId) {
        return { status: 400, message: "Tenant context is required. Please ensure you are part of a tenant." };
      }

      const combinedDateTime = combineDateTime(
        formData.basicInfo.date,
        formData.basicInfo.time,
        formData.basicInfo.timeFormat || "AM"
      );

      // Validate date/time is not in the past
      const now = new Date();
      if (combinedDateTime < now) {
        return {
          status: 400,
          message: "Webinar date and time cannot be in the past",
        };
      }

      // Validate date is a valid Date object
      if (isNaN(combinedDateTime.getTime())) {
        return {
          status: 400,
          message: "Invalid date or time format",
        };
      }

      try {
        // Get dataset ID if script was generated from datasets
        const datasetId = formData.script?.datasetIds && formData.script.datasetIds.length > 0
          ? formData.script.datasetIds[0] // Use first dataset ID
          : null

        const webinar = await prisma.webinar.create({
          data: {
            title: formData.basicInfo.webinarName.trim(),
            description: formData.basicInfo.description?.trim() || "",
            startTime: combinedDateTime,
            tags: formData.cta.tags || [],
            ctaLabel: formData.cta.ctaLabel.trim(),
            ctaType: formData.cta.ctaType,
            aiAgentId: formData.cta.aiAgent || null,
            priceId: formData.cta.priceId || null,
            lockChat: formData.additionalInfo.lockChat || false,
            couponCode: formData.additionalInfo.couponEnabled
              ? formData.additionalInfo.couponCode?.trim() || null
              : null,
            couponEnabled: formData.additionalInfo.couponEnabled || false,
            sellingScript: formData.script?.content?.trim() || null,
            scriptVersion: 1,
            datasetId: datasetId,
            presenterId,
            tenantId: context.tenantId,
          },
        });

        // Update AI agent with the webinar script if script and agent are provided
        if (formData.script?.content?.trim() && formData.cta.aiAgent) {
          try {
            const firstMessage = `Welcome to ${formData.basicInfo.webinarName}! I'm here to help you learn more about what we're offering today. How can I assist you?`;
            
            await updateAssistantForWebinar(
              formData.cta.aiAgent,
              firstMessage,
              formData.script.content.trim(),
              webinar.id
            );
          } catch (agentError) {
            // Log error but don't fail webinar creation
            console.error("Error updating AI agent with webinar script:", agentError);
            // Continue with webinar creation even if agent update fails
          }
        }

        revalidatePath("/");
        revalidatePath("/webinars");

        return {
          status: 200,
          message: "Webinar created successfully",
          webinarId: webinar.id,
          webinarLink: `/live-webinar/${webinar.id}`,
        };
      } catch (dbError: unknown) {
        console.error("Database error creating webinar:", dbError);
        
        // Handle specific database errors
        if (dbError && typeof dbError === 'object' && 'code' in dbError) {
          const prismaError = dbError as { code: string; message?: string };
          
          if (prismaError.code === 'P2002') {
            return {
              status: 400,
              message: "A webinar with this configuration already exists",
            };
          }
          
          if (prismaError.code === 'P2003') {
            return {
              status: 400,
              message: "Invalid reference. Please check your AI agent or product selection.",
            };
          }
        }

        return {
          status: 500,
          message: dbError instanceof Error ? dbError.message : "Failed to create webinar in database",
        };
      }
    });
  } catch (error) {
    console.error("Error creating webinar:", error);
    
    // Handle tenant context errors
    if (error instanceof Error) {
      if (error.message.includes('Tenant context') || error.message.includes('tenant')) {
        return {
          status: 400,
          message: "Tenant context error. Please ensure you are properly authenticated and part of a tenant.",
        };
      }
    }

    return {
      status: 500,
      message: error instanceof Error ? error.message : "Failed to create webinar. Please try again.",
    };
  }
};

// Helper function to combine date and time
function combineDateTime(
  date: Date,
  timeStr: string,
  timeFormat: "AM" | "PM"
): Date {
  const [hoursStr, minutesStr] = timeStr.split(":");
  let hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr || "0", 10);

  // Convert to 24-hour format
  if (timeFormat === "PM" && hours < 12) {
    hours += 12;
  } else if (timeFormat === "AM" && hours === 12) {
    hours = 0;
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export const getWebinarByPresenterId = async (
  presenterId: string,
  webinarStatus?: string
) => {
  try {
    let statusFilter: WebinarStatusEnum | undefined;

    switch (webinarStatus) {
      case "upcoming":
        statusFilter = WebinarStatusEnum.SCHEDULED;
        break;
      case "ended":
        statusFilter = WebinarStatusEnum.ENDED;
        break;
      default:
        statusFilter = undefined;
    }

    return await runTenantOperation(async (prisma, context) => {
      const actorId = context.actorId;
      if (!actorId) {
        return [];
      }

      const actorRecord = await prisma.user.findUnique({
        where: { clerkId: actorId },
        select: { id: true, tenantMemberships: { where: { tenantId: context.tenantId } } },
      });

      if (!actorRecord || actorRecord.tenantMemberships.length === 0) {
        return [];
      }

      if (actorRecord.id !== presenterId) {
        return [];
      }

      return prisma.webinar.findMany({
        where: {
          presenterId,
          tenantId: context.tenantId,
          webinarStatus: statusFilter,
        },
        include: {
          presenter: {
            select: {
              id: true,
              name: true,
              stripeConnectId: true,
            },
          },
        },
      });
    });
  } catch (error) {
    console.error("Error fetching webinars:", error);
    throw new Error("Failed to fetch webinars");
  }
};

export const getWebinarById = async (webinarId: string) => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const webinar = await prisma.webinar.findFirst({
        where: { id: webinarId, tenantId: context.tenantId },
        include: {
          presenter: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              stripeConnectId: true,
            },
          },
        },
      });

      return webinar;
    });
  } catch (error) {
    console.error("Error fetching webinar:", error);
    throw new Error("Failed to fetch webinar");
  }
};

// change webinar status
export const changeWebinarStatus = async (
  webinarId: string,
  status: WebinarStatusEnum
) => {
  try {
    return await runTenantOperation(async (prisma, context) => {
      const webinar = await prisma.webinar.updateMany({
        where: {
          id: webinarId,
          tenantId: context.tenantId,
        },
        data: {
          webinarStatus: status,
        },
      });

      if (webinar.count === 0) {
        return {
          status: 404,
          success: false,
          message: "Webinar not found for this tenant",
        };
      }

      return {
        status: 200,
        success: true,
        message: "Webinar status updated successfully",
      };
    });
  } catch (error) {
    console.error("Error updating webinar status:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to update webinar status. Please try again.",
    };
  }
};
