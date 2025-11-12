"use server";

import { aiAgentPrompt } from "@/lib/data";
import { vapiServer } from "@/lib/vapi/vapiServer";
import { runTenantOperation } from "@/lib/tenant/auth";

export const createAssistant = async (name: string, userId: string) => {
  try {
    const createdAssistant = await vapiServer.assistants.create({
      name: name,
      firstMessage: `Hi there, this is ${name} from customer support. How can I help you today?`,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: aiAgentPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    });

    console.log("Assistant created:", createdAssistant);

    return await runTenantOperation(async (prisma, context) => {
      // Check if tenant exists before setting tenantId
      const tenantExists = context.tenantId
        ? await prisma.tenant.findUnique({ where: { id: context.tenantId } })
        : null;

      const aiAgent = await prisma.aiAgents.create({
        data: {
          id: (createdAssistant as unknown as { id: string }).id,
          model: "gpt-4o",
          provider: "openai",
          prompt: aiAgentPrompt,
          name: name,
          firstMessage: `Hi there, this is ${name} from customer support. How can I help you today?`,
          userId: userId,
          tenantId: tenantExists ? context.tenantId : null,
        },
      });

      return {
        success: true,
        status: 200,
        data: aiAgent,
      };
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to create agent",
    };
  }
};

//update assistant
export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  try {
    const updatedAssistant = await vapiServer.assistants.update(assistantId, {
      firstMessage: firstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    });
    console.log("Assistant updated:", updatedAssistant);

    return await runTenantOperation(async (prisma, context) => {
      const updateAiAgent = await prisma.aiAgents.updateMany({
        where: {
          id: assistantId,
          tenantId: context.tenantId,
        },
        data: {
          firstMessage: firstMessage,
          prompt: systemPrompt,
        },
      });

      if (updateAiAgent.count === 0) {
        return {
          success: false,
          status: 404,
          message: "Assistant not found or access denied",
        };
      }

      // Fetch the updated record
      const updatedRecord = await prisma.aiAgents.findUnique({
        where: { id: assistantId },
      });

      return {
        success: true,
        status: 200,
        data: updatedRecord,
      };
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    return {
      success: false,
      status: 500,
      message: error instanceof Error ? error.message : "Failed to update agent",
    };
  }
};

/**
 * Update AI agent with webinar-specific script
 * This is called when a webinar is created with a script
 */
export const updateAssistantForWebinar = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string,
  webinarId: string
) => {
  try {
    // Update Vapi assistant
    const updatedAssistant = await vapiServer.assistants.update(assistantId, {
      firstMessage: firstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    });
    
    console.log("Assistant updated for webinar:", updatedAssistant);

    // Update database record
    return await runTenantOperation(async (prisma, context) => {
      const updateAiAgent = await prisma.aiAgents.updateMany({
        where: {
          id: assistantId,
          tenantId: context.tenantId,
        },
        data: {
          firstMessage: firstMessage,
          prompt: systemPrompt,
        },
      });

      if (updateAiAgent.count === 0) {
        return {
          success: false,
          status: 404,
          message: "Assistant not found or access denied",
        };
      }

      // Fetch the updated record
      const updatedRecord = await prisma.aiAgents.findUnique({
        where: { id: assistantId },
      });

      // Optionally log this update for audit purposes
      console.log(`AI agent ${assistantId} updated for webinar ${webinarId}`);

      return {
        success: true,
        status: 200,
        data: updatedRecord,
      };
    });
  } catch (error) {
    console.error("Error updating assistant for webinar:", error);
    return {
      success: false,
      status: 500,
      message: error instanceof Error ? error.message : "Failed to update agent for webinar",
    };
  }
};
