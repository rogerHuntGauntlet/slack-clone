import React from 'react'
import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileCardProps {
  user: {
    id: string;
    username: string;
    avatar_url: string;
    email: string;
    phone?: string;
    bio?: string;
    employer?: string;
    status: 'online' | 'offline' | 'away';
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url} alt={user.username} />
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <CardTitle className="text-lg">{user.username}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          user.status === 'online' ? 'bg-green-500' :
          user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
        }`} />
      </CardHeader>
      <CardContent>
        {user.phone && (
          <p className="text-sm mb-2"><strong>Phone:</strong> {user.phone}</p>
        )}
        {user.employer && (
          <p className="text-sm mb-2"><strong>Employer:</strong> {user.employer}</p>
        )}
        {user.bio && (
          <p className="text-sm"><strong>Bio:</strong> {user.bio}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default ProfileCard

