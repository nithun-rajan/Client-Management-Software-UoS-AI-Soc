import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>+ New Property</DropdownMenuItem>
            <DropdownMenuItem>+ New Landlord</DropdownMenuItem>
            <DropdownMenuItem>+ New Applicant</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}
