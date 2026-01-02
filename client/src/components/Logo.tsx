import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
  xl: "h-12",
};

export const Logo = ({ 
  className, 
  size = "md", 
  showText = true,
  textClassName 
}: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/protolablogo.png" 
        alt="ProtoLab Logo" 
        className={cn(sizeClasses[size], "w-auto object-contain")}
      />
      {showText && (
        <span className={cn("font-bold gradient-text", textClassName)}>
          ProtoLab
        </span>
      )}
    </div>
  );
};

export default Logo;
