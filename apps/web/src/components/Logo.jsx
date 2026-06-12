import dropLogo from "../../assets/screen.svg";

export function Logo({ 
  size = 40, 
  className = "", 
  showText = true, 
  textColor = "text-[#0a647a]",
  textClassName = "mt-2 font-bold text-lg"
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src={dropLogo} 
        alt="AquaFlow Logo" 
        style={{ width: size, height: size, objectFit: "contain" }} 
        className="drop-shadow-sm"
      />
      {showText && <span className={`${textClassName} ${textColor}`}>AquaFlow</span>}
    </div>
  );
}
