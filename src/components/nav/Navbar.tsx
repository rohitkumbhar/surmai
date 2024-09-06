import {useState} from 'react';
import {Center, rem, Stack, Tooltip, UnstyledButton} from '@mantine/core';
import {IconCalendarStats, IconHome2, IconSettings, IconUser,} from '@tabler/icons-react';
import {MantineLogo} from '@mantinex/mantine-logo';
import classes from './Navbar.module.css';
import {useNavigate, useParams} from "react-router-dom";
import {UserButton} from "../user/UserButton.tsx";


const mainNavigation = [
  // {
  //   icon: IconGauge, key: 'dashboard', label: 'Dashboard', route: '/dashboard', subLinks: [
  //     {key: 'upcoming_trips', label: "Upcoming Trips"},
  //     {key: 'past_trips', label: "Past Trips"},
  //     {key: 'activity', label: "Activity"}
  //   ]
  // },
  {
    icon: IconCalendarStats, label: 'Trips', route: '/trips', key: 'trips', subLinks: [
      {key: 'all_trips', label: "My Trips", route: '/trips',},
      {key: 'create_new_trip', label: "Create New Trip", route: '/trips/create',},
      // {key: 'overview', label: "Overview"},
      // {key: 'transportation', label: "Transportation"},
      // {key: 'lodging', label: "Lodging"},
      // {key: 'bookings', label: "Other Bookings"},
      // {key: 'sharing', label: "Sharing"},
    ]
  },
  {
    icon: IconUser, key: 'account', label: 'Account', route: '/profile', subLinks: [
      {key: 'profile', label: "Profile", route: '/profile',},
      {key: 'security', label: "Security", route: '/profile',},
    ]
  },
];


interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;

  onClick?(): void;
}

function NavbarLink({icon: Icon, label, active, onClick}: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{duration: 0}}>
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Icon style={{width: rem(20), height: rem(20)}} stroke={1.5}/>
      </UnstyledButton>
    </Tooltip>
  );
}


export function Navbar() {

  const mockdata = [
    {icon: IconHome2, label: 'Home'},
    {icon: IconSettings, label: 'Settings'},
  ];

  const {tripId} = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  // const [activeSubLink, setActiveSubLink] = useState('all_trips');
  // const [subLinks, setSubLinks] = useState([]);

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => setActive(index)}
    />
  ));

  // const mainLinks = mainNavigation.map((navItem) => (
  //   <Tooltip
  //     label={navItem.label}
  //     position="right"
  //     withArrow
  //     transitionProps={{duration: 0}}
  //     key={navItem.key}
  //   >
  //     <UnstyledButton
  //       onClick={() => {
  //         setActive(navItem.key as string);
  //         navigate(navItem.route);
  //       }}
  //       className={classes.mainLink}
  //       data-active={navItem.key === active || undefined}
  //     >
  //       <navItem.icon style={{width: rem(22), height: rem(22)}} stroke={1.5}/>
  //     </UnstyledButton>
  //   </Tooltip>
  // ));


  // useEffect(() => {
  //
  //
  //   const selectedSublinks = mainNavigation.find(entry => entry.key === active)?.subLinks;
  //   // @ts-expect-error no type
  //   setSubLinks(selectedSublinks);
  //   if (selectedSublinks) {
  //     setActiveSubLink(selectedSublinks[0].key)
  //   }
  // }, [active]);


  // const links = subLinks.map((link: { key: string, label: string, route: string }) => (
  //   <Link className={classes.link}
  //         data-active={activeSubLink === link.key || undefined}
  //         onClick={() => {
  //           setActiveSubLink(link.key);
  //         }}
  //         key={link.key}
  //         to={link.route}>
  //     {link.label}</Link>
  // ));

  return (
    // <nav className={classes.navbar}>
    //   <div className={classes.wrapper}>
    //     <div className={classes.aside}>
    //       <div className={classes.logo}>
    //         <MantineLogo type="mark" size={30}/>
    //       </div>
    //       {mainLinks}
    //     </div>
    //     <div className={classes.main}>
    //       <Title order={4} className={classes.title}>
    //         {mainNavigation.find(entry => entry.key === active)?.label}
    //       </Title>
    //
    //       {links}
    //     </div>
    //
    //   </div>
    //   <div className={classes.footer}>
    //     <UserInfo/>
    //   </div>
    // </nav>

    <nav className={classes.navbar}>
      <Center>
        <MantineLogo type="mark" inverted size={30}/>
      </Center>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <div className={classes.link}>
          <UserButton />
        </div>
      </Stack>
    </nav>

  );
}