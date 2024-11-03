import { rem } from '@mantine/core';

interface FishOneIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export const FishOne = ({ size, style, ...others }: FishOneIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      // fill="white"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 512 512"
      style={{ width: rem(size), height: rem(size), ...style }}
      {...others}
    >
      <path
        style={{ fill: '#C9E3F7' }}
        d="M503.658,244.435c-3.735-5.178-92.789-126.816-207.129-126.816S93.135,239.256,89.4,244.435
	L81.058,256l8.342,11.565c3.735,5.178,92.789,126.816,207.129,126.816s203.394-121.637,207.129-126.816L512,256L503.658,244.435z"
      />
      <path
        style={{ fill: '#AED5F3' }}
        d="M296.529,394.38c114.34,0,203.394-121.637,207.129-126.816L512,256l-8.342-11.565
	c-3.735-5.178-92.789-126.816-207.129-126.816"
      />
      <circle
        style={{ fill: '#3C5D76' }}
        cx="362.424"
        cy="256.003"
        r="19.769"
      />
      <path
        style={{ fill: '#AED5F3' }}
        d="M121.465,243.979C119.296,240.973,67.568,170.335,0,170.335v19.769v19.769v91.345v19.769v19.769
	c67.568,0,119.297-70.638,121.465-73.645l8.342-11.565L121.465,243.979z"
      />
    </svg>
  );
};
