import avatarSrc from "@/assets/teacher-avatar.png";

export default function TeacherAvatar() {
  return (
    <div className="relative w-full flex items-end justify-center md:justify-end">
      {/* Ambient halo behind avatar */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-square rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-accent/15 blur-3xl" />

      {/* Avatar — tuned to balance the text column visually */}
      <img
        src={avatarSrc}
        alt="AI nastavnik"
        draggable={false}
        className="relative select-none object-contain object-bottom
                   w-[260px] sm:w-[320px] md:w-[380px] lg:w-[440px] xl:w-[480px]
                   h-auto max-h-[540px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
      />
    </div>
  );
}
