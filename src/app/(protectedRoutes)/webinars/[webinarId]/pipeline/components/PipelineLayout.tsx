import { Badge } from "@/components/ui/badge"
import UserInfoCard from "@/components/ReusableComponent/UserInfoCard"
import { CallStatusEnum } from "@prisma/client"
import { pipelineTags } from "@/lib/data"

interface StatusColumnProps {
  title: string
  count: number
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    attendedAt?: Date | null;
    stripeConnectId?: string | null;
    callStatus: CallStatusEnum | null;
    createdAt: Date;
    updatedAt: Date;
  }>
}

const PipelineLayout = ({ title, count, users}: StatusColumnProps) =>{
  return (
    <div className="flex-shrink-0 w-[350px] p-5 border border-border bg-background/10 rounded-xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">{title}</h2>
        <Badge variant="secondary">{count}</Badge>
      </div>

      <div className="space-y-3 w-full h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
        {users.map((user, index) => (
          <UserInfoCard key={index} customer={user} tags={pipelineTags} />
        ))}
      </div>
    </div>
  )
}

export default PipelineLayout;
