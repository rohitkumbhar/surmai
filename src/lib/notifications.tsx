import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle, IconTrash, IconX } from '@tabler/icons-react';

export const showInfoNotification = ({ title, message }: { title: string; message: string }) => {
  notifications.show({
    title,
    message,
    withCloseButton: true,
    icon: <IconInfoCircle size={18} />,
    withBorder: true,
    color: 'blue',
  });
};

export const showSaveSuccessNotification = ({ title, message }: { title: string; message: string }) => {
  notifications.show({
    title,
    message,
    withCloseButton: true,
    icon: <IconCheck size={18} />,
    withBorder: true,
    color: 'green',
  });
};

export const showDeleteNotification = ({ title, message }: { title: string; message: string }) => {
  notifications.show({
    title,
    message,
    withCloseButton: true,
    icon: <IconTrash size={18} />,
    withBorder: true,
    color: 'red',
  });
};

export const showErrorNotification = ({ title, message, error }: { title: string; message: string; error: any }) => {
  // figure out how to show this cleanly in the bubble
  console.log(error);

  notifications.show({
    title,
    message,
    icon: <IconX size={18} />,
    withCloseButton: true,
    withBorder: true,
    variant: 'error',
    color: 'red',
  });
};

export const showLoadingNotification = ({ title, message }: { title: string; message: string }): string => {
  return notifications.show({
    title,
    message,
    withCloseButton: true,
    withBorder: true,
    loading: true,
  });
};

export const clearLoadingNotification = ({ id, title, message }: { id: string; title: string; message: string }) => {
  notifications.update({
    id,
    title,
    message,
    icon: <IconCheck size={18} />,
    withCloseButton: true,
    withBorder: true,
    loading: false,
    autoClose: true,
  });
};
