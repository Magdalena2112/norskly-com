import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  className?: string;
}

export default function BackButton({ to, className }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={className}
    >
      <ArrowLeft className="w-4 h-4" />
    </Button>
  );
}
