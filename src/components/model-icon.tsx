import Image from 'next/image';

export function ModelIcon({
  src,
  name,
  className = 'size-4',
}: {
  src: string;
  name: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={name}
      width={20}
      height={20}
      className={`${className} shrink-0 object-contain`}
      unoptimized
    />
  );
}
