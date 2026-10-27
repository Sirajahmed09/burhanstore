import Image from 'next/image';
export default function BrandLogo({ dark = false }) {
  return <span className="inline-flex items-center gap-2.5">
    <Image src="/brand/burhan-symbol.webp" alt="" width={42} height={42} priority className="rounded-lg shrink-0" />
    <span className="flex flex-col leading-none">
      <span className={`font-heading text-xl sm:text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-[#171A20]'}`}>BURHAN</span>
      <span className={`text-[9px] uppercase tracking-[0.35em] mt-1 ${dark ? 'text-[#B9A47C]' : 'text-[#65563D]'}`}>STORE</span>
    </span>
  </span>;
}
