import Image, { ImageProps } from 'next/image';

type FlagIconProps = {
  flag: string;
} & Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'>;

const FlagIcon = ({ flag, ...props }: FlagIconProps) => {
  return <Image src={flag} alt="Flag" width={18} height={24} {...props} />;
};

export default FlagIcon;
