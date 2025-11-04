import { Settings as SettingsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";

export default function Settings() {
  return (
    <div>
      <Header title="Settings" />
      <div className="space-y-6 p-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Configure your backend API connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Base URL</label>
              <Input
                type="text"
                defaultValue="http://localhost:8000"
                placeholder="http://localhost:8000"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-3 w-3 animate-pulse rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input type="text" defaultValue="Estate Agent" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" defaultValue="agent@team67.co.uk" />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
