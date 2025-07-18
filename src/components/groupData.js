// src/data/groupData.js

import s1 from '/img/s1.jpg';
import s2 from '/img/s2.jpg';
import s3 from '/img/s3.jpg';
import s4 from '/img/s4.jpg';
import s5 from '/img/s5.jpg';
import s6 from '/img/s6.jpg';
import s7 from '/img/s7.jpg';
import s8 from '/img/s8.jpg';
import s9 from '/img/s9.jpg';
import s10 from '/img/s10.png';
import s11 from '/img/s11.jpg';
import s12 from '/img/s12.jpg';
import s13 from '/img/s13.png';
import s14 from '/img/s14.jpg';
import s15 from '/img/s15.jpg';
import s16 from '/img/s16.jpg';
import s17 from '/img/s17.jpg';
import s18 from '/img/s18.jpg';
import s19 from '/img/s19.jpg';
import s20 from '/img/s20.jpg';
import s21 from '/img/s21.jpg';
import s22 from '/img/s22.jpg';
import s23 from '/img/s23.jpg';
import s24 from '/img/s24.jpg';
import s25 from '/img/s25.jpg';
import s26 from '/img/s26.jpg';
import s27 from '/img/s27.jpg';

export const groups = [
  {
    value: 'sahn',
    label: 'groupCourtyardPlural',
    icon: 'courtyard',
    property: 'group',
    svg: `
    <svg width="30" height="30" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2073 2.9087C9.5 3.53569 9.5 4.68259 9.5 6.9764V18.0236C9.5 20.3174 9.5 21.4643 10.2073 22.0913C10.9145 22.7183 11.9955 22.5297 14.1576 22.1526L16.4864 21.7465C18.8809 21.3288 20.0781 21.12 20.7891 20.2417C21.5 19.3635 21.5 18.0933 21.5 15.5529V9.44711C21.5 6.90671 21.5 5.63652 20.7891 4.75826C20.0781 3.87999 18.8809 3.67118 16.4864 3.25354L14.1576 2.84736C11.9955 2.47026 10.9145 2.28171 10.2073 2.9087ZM12.5 10.6686C12.9142 10.6686 13.25 11.02 13.25 11.4535V13.5465C13.25 13.98 12.9142 14.3314 12.5 14.3314C12.0858 14.3314 11.75 13.98 11.75 13.5465V11.4535C11.75 11.02 12.0858 10.6686 12.5 10.6686Z" fill="#1E2023"/>
        <path d="M8.04717 5C5.98889 5.003 4.91599 5.04826 4.23223 5.73202C3.5 6.46425 3.5 7.64276 3.5 9.99979V14.9998C3.5 17.3568 3.5 18.5353 4.23223 19.2676C4.91599 19.9513 5.98889 19.9966 8.04717 19.9996C7.99985 19.3763 7.99992 18.6557 8.00001 17.8768V7.1227C7.99992 6.34388 7.99985 5.6233 8.04717 5Z" fill="#1E2023"/>
    </svg>
    `
  },
  {
    value: 'eyvan',
    label: 'groupEyvanPlural',
    icon: 'eyvan',
    property: 'group',
    svg: `<svg width="30" height="30" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.10815 20.7034H7.27717V11.6207C7.27717 9.2011 12.5068 5.23914 12.5068 5.23914C12.5404 5.25954 17.7363 9.19995 17.7363 11.6207V20.7034H22.8919V4.27663H21.4819V2.76565C21.4819 1.94453 20.8156 1.27487 19.9945 1.27487H5.01912C4.198 1.27487 3.53165 1.94453 3.53165 2.76565V4.27663H2.10815V20.7034ZM23.1494 21.3778H1.85071C1.38087 21.3778 1 21.7586 1 22.2285C1 22.6983 1.38087 23.0792 1.85071 23.0792H23.1493C23.6191 23.0792 24 22.6983 24 22.2285C24.0001 21.7586 23.6192 21.3778 23.1494 21.3778Z" fill="#1E2023"/>
                </svg>`
  },
  {
    value: 'ravaq',
    label: 'groupRavaqPlural',
    icon: 'shrine',
    property: 'group',
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 25 25" fill="none">
    <g clip-path="url(#clip0_221_847)">
        <path d="M18.7101 10.1075L20.4201 10.1112V7.45249H17.5326C18.1016 8.24816 18.5023 9.1516 18.7101 10.1075ZM16.7638 5.90374H20.4201V2.05624H13.8688C14.2213 2.27374 14.6413 2.56999 15.0538 2.95999C15.9651 3.81499 16.5388 4.80499 16.7638 5.90374ZM11.1238 2.05624H4.58008V5.90374H8.23633C8.64883 3.87499 10.1563 2.64874 11.1238 2.05624ZM4.58008 7.44874V10.1075H6.29008C6.50008 9.14749 6.90133 8.23624 7.46758 7.44874H4.58008Z" fill="#1E2023"/>
        <path d="M22.9326 23.9113H21.4626V22.805H21.0726V21.8675H20.6789C20.9076 19.1712 20.9076 16.4788 20.6789 13.7863H21.0726V12.8488H21.4626V11.6637H21.9764V0.5H3.02386V11.6637H3.53761V12.8488H3.92761V13.7863H4.32136C4.09261 16.4825 4.09261 19.175 4.32136 21.8675H3.92761V22.805H3.53761V23.9113H2.06761C1.9926 23.9151 1.92191 23.9475 1.87016 24.002C1.81841 24.0564 1.78955 24.1286 1.78955 24.2038C1.78955 24.2789 1.81841 24.3511 1.87016 24.4055C1.92191 24.46 1.9926 24.4925 2.06761 24.4963H22.9364C23.0976 24.4963 23.2289 24.365 23.2289 24.2038C23.2279 24.1258 23.1962 24.0514 23.1408 23.9967C23.0853 23.9419 23.0105 23.9112 22.9326 23.9113ZM12.9764 1.83125C12.9951 1.74875 13.0701 1.68875 13.1564 1.68875H20.6076C20.7089 1.68875 20.7914 1.77125 20.7914 1.8725V6.0875C20.7914 6.18875 20.7089 6.27125 20.6076 6.27125H16.6139C16.5239 6.27125 16.4489 6.2075 16.4339 6.1175C16.2464 5.0375 15.6989 4.06625 14.8064 3.2225C14.1239 2.585 13.4301 2.2025 13.0776 2.03375C13.0397 2.01714 13.0089 1.9878 12.9904 1.95081C12.9719 1.91381 12.9669 1.87152 12.9764 1.83125ZM4.21261 1.8725C4.21261 1.77125 4.29511 1.68875 4.39636 1.68875H11.8439C11.9301 1.68875 12.0051 1.74875 12.0239 1.83125C12.0389 1.91375 11.9976 2 11.9226 2.0375C11.2476 2.36 9.00511 3.60875 8.57011 6.12125C8.55511 6.2075 8.48011 6.275 8.39011 6.275H4.39636C4.34763 6.275 4.30089 6.25564 4.26643 6.22118C4.23197 6.18672 4.21261 6.13998 4.21261 6.09125V1.8725ZM4.21261 10.2875V7.265C4.21261 7.16375 4.29511 7.08125 4.39636 7.08125H7.83886C7.87352 7.08151 7.90741 7.09153 7.93665 7.11015C7.96588 7.12878 7.98927 7.15527 8.00414 7.18658C8.01902 7.2179 8.02477 7.25276 8.02074 7.28719C8.01671 7.32162 8.00306 7.35422 7.98136 7.38125C7.30261 8.225 6.83386 9.24125 6.62011 10.325C6.60511 10.4113 6.52636 10.475 6.44011 10.475H4.39636C4.34747 10.4735 4.30106 10.4531 4.26683 10.4182C4.23259 10.3832 4.21317 10.3364 4.21261 10.2875ZM18.6089 21.8713H18.2189V22.8088H17.8289V23.915H7.17136V22.8088H6.78136V21.8713H6.38761C6.61636 19.175 6.61636 16.4825 6.38761 13.79H6.77761V12.8525H7.16761V11.6675H7.68136C7.68136 9.8825 8.47261 8.30375 9.69136 7.34C9.44386 4.3775 12.4964 3.0875 12.4964 3.0875C12.4964 3.0875 15.5526 4.38125 15.3051 7.34C16.5239 8.30375 17.3189 9.8825 17.3189 11.6675H17.8289V12.8525H18.2189V13.79H18.6089C18.3801 16.4825 18.3801 19.175 18.6089 21.8713ZM20.6039 10.475L18.5601 10.4713C18.5175 10.4704 18.4765 10.4551 18.4438 10.4278C18.4111 10.4006 18.3886 10.363 18.3801 10.3212C18.1664 9.2375 17.6976 8.22125 17.0189 7.3775C16.9972 7.35047 16.9835 7.31787 16.9795 7.28344C16.9755 7.24901 16.9812 7.21415 16.9961 7.18283C17.0109 7.15152 17.0343 7.12503 17.0636 7.1064C17.0928 7.08777 17.1267 7.07776 17.1614 7.0775H20.6039C20.7051 7.0775 20.7876 7.16 20.7876 7.26125V10.2875C20.7876 10.3363 20.7689 10.3813 20.7351 10.4188C20.7014 10.4563 20.6526 10.475 20.6039 10.475Z" fill="#1E2023"/>
    </g>
    <defs>
        <clipPath id="clip0_221_847">
            <rect width="24" height="24" fill="white" transform="translate(0.5 0.5)"/>
        </clipPath>
    </defs>
</svg>
`
  },
  {
    value: 'masjed',
    label: 'groupMosques',
    icon: 'mosque',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h7v-2a2 2 0 1 1 4 0v2h7"/><path d="M4 21v-10"/><path d="M20 21v-10"/><path d="M4 16h3v-3h10v3h3"/><path d="M17 13a5 5 0 0 0 -10 0"/><path d="M21 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M5 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M12 2a2 2 0 1 0 2 2"/><path d="M12 6v2"/></svg>`
  },
  {
    value: 'madrese',
    label: 'groupSchools',
    icon: 'school',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/></svg>`
  },
  {
    value: 'khadamat',
    label: 'groupServices',
    icon: 'services',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`
  },
  {
    value: 'elmi',
    label: 'groupCulture',
    icon: 'culture',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6l0 13"/><path d="M12 6l0 13"/><path d="M21 6l0 13"/></svg>`
  },
  {
    value: 'cemetery',
    label: 'groupCemetery',
    icon: 'cemetery',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4v16"/><path d="M19 4v16"/><path d="M9 4v16"/><path d="M15 4v16"/><path d="M3 4h18"/></svg>`
  },
  {
    value: 'qrcode',
    label: 'groupQRScan',
    icon: 'qr-code',
    property: 'nodeFunction',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 17l0 .01"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 7l0 .01"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M17 7l0 .01"/><path d="M14 14l3 0"/><path d="M20 14l0 .01"/><path d="M14 14l0 3"/><path d="M14 20l3 0"/><path d="M17 17l3 0"/><path d="M20 17l0 3"/></svg>`
  },
  {
    value: 'elevator',
    label: 'groupElevator',
    icon: 'elevator',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="16" rx="1"/><path d="M10 10l2 -2l2 2"/><path d="M14 14l-2 2l-2 -2"/></svg>`
  },
  {
    value: 'other',
    label: 'groupOther',
    icon: 'other',
    property: 'group',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9l3 3l-3 3"/><path d="M13 15l3 0"/><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/></svg>`
  }
];

export const subGroups = {
  sahn: [
    {
      value: 'sahn-enqelab',
      label: 'صحن انقلاب',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s1
    },
    {
      value: 'sahn-azadi',
      label: 'صحن آزادی',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s2
    },
    {
      value: 'sahn-jomhouri',
      label: 'صحن جمهوری اسلامی',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s3
    },
    {
      value: 'sahn-qods',
      label: 'صحن قدس',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s4
    },
    {
      value: 'sahn-jame-razavi',
      label: 'صحن جامع رضوی',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s5
    },
    {
      value: 'sahn-ghadir',
      label: 'صحن غدیر',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s6
    },
    {
      value: 'sahn-kosar',
      label: 'صحن کوثر',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s7
    },
    {
      value: 'sahn-emam-hasan',
      label: 'صحن امام حسن مجتبی',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s8
    },
    {
      value: 'sahn-payambar-azam',
      label: 'صحن پیامبر اعظم',
      icon: 'courtyard',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01"/><path d="M3 21h18"/><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/></svg>`,
      description: 'توضیحات',
      img: s9
    }
  ],
  eyvan: [
    {
      value: 'eyvan-abbasi',
      label: 'ایوان عباسی',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s10
    },
    {
      value: 'eyvan-talayi',
      label: 'ایوان طلایی',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s11
    },
    {
      value: 'eyvan-saat',
      label: 'ایوان ساعت',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s12
    },
    {
      value: 'eyvan-naqare',
      label: 'ایوان نقاره',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s13
    },
    {
      value: 'eyvan-valiasr',
      label: 'ایوان ولیعصر',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s14
    },
    {
      value: 'eyvan-talaye-azadi',
      label: 'ایوان طلای آزادی',
      icon: 'eyvan',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0"/><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/></svg>`,
      description: 'توضیحات',
      img: s15
    }
  ],
  ravaq: [
    {
      value: 'daralhefaz',
      label: 'دارالحفاظ',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s16
    },
    {
      value: 'daralsiade',
      label: 'دارالسياده',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s17
    },
    {
      value: 'daralsalam',
      label: 'دارالسلام',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s18
    },
    {
      value: 'hatamkhani',
      label: 'حاتم خانی',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s19
    },
    {
      value: 'gonbadallahverdi',
      label: 'گنبدالله وردی خان',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s20
    },
    {
      value: 'daralziafe',
      label: 'دارالضیافه',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s21
    },
    {
      value: 'tohidkhane',
      label: 'توحیدخانه',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s22
    },
    {
      value: 'daralfeyz',
      label: 'دارالفیض',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s23
    },
    {
      value: 'daralsaade',
      label: 'دارالسعاده', icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s24
    },
    {
      value: 'goharsad',
      label: 'گوهرشاد',
      icon: 'shrine',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 18l2 -13l2 -2l2 2l2 13"/><path d="M5 21v-3h14v3"/><path d="M3 21l18 0"/></svg>`,
      description: 'توضیحات',
      img: s25
    }
  ],
  masjed: [
    {
      value: 'balasar',
      label: 'بالاسر',
      icon: 'mosque',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h7v-2a2 2 0 1 1 4 0v2h7"/><path d="M4 21v-10"/><path d="M20 21v-10"/><path d="M4 16h3v-3h10v3h3"/><path d="M17 13a5 5 0 0 0 -10 0"/><path d="M21 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M5 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M12 2a2 2 0 1 0 2 2"/><path d="M12 6v2"/></svg>`,
      description: 'توضیحات',
      img: s26
    },
    {
      value: 'goharsad',
      label: 'گوهرشاد',
      icon: 'mosque',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h7v-2a2 2 0 1 1 4 0v2h7"/><path d="M4 21v-10"/><path d="M20 21v-10"/><path d="M4 16h3v-3h10v3h3"/><path d="M17 13a5 5 0 0 0 -10 0"/><path d="M21 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M5 10.5c0 -.329 -.077 -.653 -.224 -.947l-.776 -1.553l-.776 1.553a2.118 2.118 0 0 0 -.224 .947a.5 .5 0 0 0 .5 .5h1a.5 .5 0 0 0 .5 -.5z"/><path d="M12 2a2 2 0 1 0 2 2"/><path d="M12 6v2"/></svg>`,
      description: 'توضیحات',
      img: s27
    }
  ],
  madrese: [
    {
      value: 'payeen-khyaban',
      label: 'پایین خیابان',
      icon: 'school',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'bala-khyaban',
      label: 'بالا خیابان',
      icon: 'school',
      svg: `<svg xmlns="http://www.w3.org/24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'navvab',
      label: 'نواب',
      icon: 'school',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'dodar',
      label: 'دودر',
      icon: 'school',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/></svg>`,
      description: 'توضیحات'
    }
  ],
  khadamat: [
    {
      value: 'wc',
      label: 'دستشویی',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'telephon',
      label: 'تلفن',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'otag-madadjo',
      label: 'اتاق مددجو',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'namaazkhane',
      label: 'نمازخانه',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'ketabkhane',
      label: 'کتابخانه',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'room',
      label: 'اتاق',
      icon: 'services',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"/><path d="M14.5 5.5l4 4"/><path d="M12 8l-5 -5l-4 4l5 5"/><path d="M7 8l-1.5 1.5"/><path d="M16 12l5 5l-4 4l-5 -5"/><path d="M16 17l-1.5 1.5"/></svg>`,
      description: 'توضیحات'
    }
  ],
  elmi: [
    {
      value: 'hoze-elmiye',
      label: 'حوزه علمیه',
      icon: 'culture',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6l0 13"/><path d="M12 6l0 13"/><path d="M21 6l0 13"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'markaz-motaleat',
      label: 'مرکز مطالعات',
      icon: 'culture',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6l0 13"/><path d="M12 6l0 13"/><path d="M21 6l0 13"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'uni',
      label: 'دانشگاه',
      icon: 'culture',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6l0 13"/><path d="M12 6l0 13"/><path d="M21 6l0 13"/></svg>`,
      description: 'توضیحات'
    }
  ],
  cemetery: [
    {
      value: 'cemetery',
      label: 'قبر',
      icon: 'cemetery',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4v16"/><path d="M19 4v16"/><path d="M9 4v16"/><path d="M15 4v16"/><path d="M3 4h18"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'yadbod',
      label: 'یادبود',
      icon: 'cemetery',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4v16"/><path d="M19 4v16"/><path d="M9 4v16"/><path d="M15 4v16"/><path d="M3 4h18"/></svg>`,
      description: 'توضیحات'
    }
  ],
  qrcode: [
    {
      value: 'bakhsh-control',
      label: 'بخش کنترل',
      icon: 'qr-code',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 17l0 .01"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 7l0 .01"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M17 7l0 .01"/><path d="M14 14l3 0"/><path d="M20 14l0 .01"/><path d="M14 14l0 3"/><path d="M14 20l3 0"/><path d="M17 17l3 0"/><path d="M20 17l0 3"/></svg>`,
      description: 'توضیحات'
    },
    {
      value: 'cctv',
      label: 'دوربین مدار بسته',
      icon: 'qr-code',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 17l0 .01"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M7 7l0 .01"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M17 7l0 .01"/><path d="M14 14l3 0"/><path d="M20 14l0 .01"/><path d="M14 14l0 3"/><path d="M14 20l3 0"/><path d="M17 17l3 0"/><path d="M20 17l0 3"/></svg>`,
      description: 'توضیحات'
    }
  ],
  elevator: [],
  other: [
    {
      value: 'other',
      label: 'سایر',
      icon: 'other',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9l3 3l-3 3"/><path d="M13 15l3 0"/><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/></svg>`,
      description: 'توضیحات'
    }
  ]
};