"use client";

interface AdBannerProps {
  visible?: boolean;
  adSlot?: string;
  adClient?: string;
}

export function AdBanner({ visible = true, adSlot, adClient }: AdBannerProps) {
  if (!adSlot) return null;
  if (!visible) return null;

  return (
    <div className="w-full bg-muted border-t border-border flex items-center justify-center min-h-[60px] max-h-[90px] sticky bottom-0 z-30">
      <ins
        className="adsbygoogle block w-full"
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
