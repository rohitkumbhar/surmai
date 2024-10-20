import {useState} from 'react';
import {Center, rem, Stack, Tooltip, UnstyledButton} from '@mantine/core';
import {IconHome2, IconSettings,} from '@tabler/icons-react';
import classes from './Navbar.module.css';
import {UserButton} from "../user/UserButton.tsx";
import {useNavigate} from "react-router-dom";
import {isAdmin} from "../../lib";
import {FishOne} from "../logo/FishOne.tsx";


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


  const mainNav = [
    {icon: IconHome2, label: 'Home', route: '/'},
    {icon: IconSettings, label: 'Settings', route: '/profile', admin: true},
  ];

  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const links = mainNav.filter(link => {
    return link.admin ? isAdmin() : true;
  }).map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => {
        setActive(index)
        navigate(link.route)
      }}
    />
  ));

  return (
    <nav className={classes.navbar}>
      <Center>
        <FishOne size={30}/>
      </Center>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <div className={classes.link}>
          <UserButton/>
        </div>
      </Stack>
    </nav>
  );
}