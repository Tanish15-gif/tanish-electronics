interface TanishElectronicsLogoProps {
  className?: string;
  variant?: "monogram" | "power" | "repair";
}

export function TanishElectronicsLogo({
  className = "h-6 w-6",
  variant = "monogram"
}: TanishElectronicsLogoProps) {
  const imageSrc =
    variant === "power"
      ? "/images/logo/tanish-logo-power.jpg"
      : variant === "repair"
        ? "/images/logo/tanish-logo-repair.jpg"
        : "/images/logo/tanish-logo-monogram.jpg";

  return (
    <img
      src={imageSrc}
      alt="Tanish Electronics Logo"
      className={`rounded-lg object-cover shadow-2xs ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

export default TanishElectronicsLogo;

