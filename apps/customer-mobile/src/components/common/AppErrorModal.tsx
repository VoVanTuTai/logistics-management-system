import React from 'react';
import { AppModal, type AppModalProps } from './AppModal';

export interface AppErrorModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  onClose: () => void;
}

export function AppErrorModal({
  visible,
  title = 'Đăng nhập thất bại',
  message = 'Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra và thử lại.',
  buttonText = 'Thử lại',
  onClose,
}: AppErrorModalProps): React.JSX.Element | null {
  return (
    <AppModal
      visible={visible}
      variant="error"
      title={title}
      message={message}
      confirmText={buttonText}
      onConfirm={onClose}
    />
  );
}
