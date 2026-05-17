import avatarSrc from "@/assets/teacher-avatar.png";

export default function TeacherAvatar() {
  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[80%] aspect-square rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
      </div>
      <div className="pointer-events-none absolute -bottom-10 left-1/4 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative w-[82%] max-w-md aspect-[4/5]">
        <img
          src={avatarSrc}
          alt="AI nastavnik"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
        />
      </div>
    </div>
  );
}
