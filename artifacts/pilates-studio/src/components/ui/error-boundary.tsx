import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-medium">Error al cargar esta sección</p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}