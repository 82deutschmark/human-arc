/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Help visitors recover from an unavailable Human ARC page.
 * SRP/DRY check: Pass — reuses shared card, button and router components.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            This page is unavailable. You can return to Human ARC and choose a puzzle or assessment.
          </p>
          <Button asChild className="mt-6"><Link href="/">Return to Human ARC</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
