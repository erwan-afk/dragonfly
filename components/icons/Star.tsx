const Star = ({ ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="13"
      viewBox="0 0 10 9"
      fill="currentColor"
      {...props}
    >
      <g clip-path="url(#clip0_649_2431)">
        <path
          d="M9.125 4.5C6.50333 5.34409 5.63908 6.284 5 8.625C4.36092 6.284 3.49667 5.34409 0.875 4.5C3.49667 3.65591 4.36092 2.71599 5 0.375C5.63908 2.71599 6.50333 3.65591 9.125 4.5Z"
          stroke="#58A4A7"
          strokeWidth="0.5625"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.25 2.25L8.375 1.125"
          stroke="#58A4A7"
          strokeWidth="0.5625"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.75 2.25L1.625 1.125"
          stroke="#58A4A7"
          strokeWidth="0.5625"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.75 6.75L1.625 7.875"
          stroke="#58A4A7"
          strokeWidth="0.5625"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.25 6.75L8.375 7.875"
          stroke="#58A4A7"
          strokeWidth="0.5625"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_649_2431">
          <rect width="9" height="9" fill="white" transform="translate(0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Star;
