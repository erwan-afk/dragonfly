interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  footer?: boolean;
  small?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, footer, small, ...props }) => (
  <span
    className={`flex flex-row items-center gap-3 fill-current ${className ?? ''}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={footer ? '120px' : small ? '60px' : '80px'}
      height={footer ? '37px' : small ? '19px' : '25px'}
      viewBox="155 725 1690 550"
      style={{ fillRule: 'evenodd', clipRule: 'evenodd' }}
      {...props}
    >
      <path d="M305.818,1063.562l85.696,-127.049l153.249,0l42.848,-63.525l-153.249,0l85.696,-127.049l306.498,0l-342.733,508.123l-306.498,0l85.646,-126.975l153.249,0l42.848,-63.525l-153.249,0Zm383.123,0l85.696,-127.049l689.621,-0l-214.19,317.549l-153.249,0l128.494,-190.5l-536.372,-0Zm637.752,190.5l257.038,-381.074l-766.246,0l85.696,-127.049l919.495,-0l-342.733,508.123l-153.249,0Zm-306.498,0l-459.747,-0l85.646,-126.975l459.747,0l-85.646,126.975Z" />
    </svg>
    <div className={`w-[.5px] self-stretch bg-current  `} />
    <span className={`font-oswald tracking-[0.4em] font-regular text-14 `}>
      3HULLS
    </span>
  </span>
);

export default Logo;
