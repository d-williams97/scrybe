"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Info, Mail, User } from "lucide-react";

export default function ShadcnDemo() {
  return (
    <main className={cn("min-h-screen bg-background p-8 space-y-8")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">shadcn/ui Demo</h1>
          <p className="text-lg text-muted-foreground">
            Testing shadcn/ui components with Next.js 15, React 19, and Tailwind
            CSS v4
          </p>
        </div>

        {/* Alerts Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Alerts</h2>
          <div className="grid gap-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                This is an info alert to test the alert component.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                This is a destructive alert variant.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link" asChild>
              <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer">
                Link Button
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>
                  This is a basic card component with header, content, and
                  footer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Card content goes here. This demonstrates the card component
                  working properly.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Form Card
                </CardTitle>
                <CardDescription>
                  A card with form elements to test inputs and labels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Elements Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Form Elements</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="johndoe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Tell us about yourself..." />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Test cn utility */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">cn() Utility Test</h2>
          <Card>
            <CardContent className="pt-6">
              <div
                className={cn(
                  "p-4 rounded-lg border-2 border-dashed",
                  "bg-muted/50",
                  "text-center text-muted-foreground",
                  "transition-colors hover:bg-muted"
                )}
              >
                This div&apos;s classes are merged using the cn() utility
                function.
                <br />
                <Badge variant="secondary" className="mt-2">
                  cn() working ✅
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status */}
        <section className="text-center space-y-4">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>All Components Working!</AlertTitle>
            <AlertDescription>
              shadcn/ui is successfully integrated with your Next.js 15 + React
              19 + Tailwind v4 setup.
            </AlertDescription>
          </Alert>
        </section>
      </div>
    </main>
  );
}
