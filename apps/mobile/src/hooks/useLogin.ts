import { UserDtoStatus } from '@repo/api-client';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';

const useLogin = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const navigateByStatus = ({
    status,
    token,
  }: {
    status: UserDtoStatus;
    token: string;
  }) => {
    switch (status) {
      case UserDtoStatus.PENDING:
        useAuthStore.getState().setAccessToken(token);
        navigation.navigate('Register');
        break;
      case UserDtoStatus.ACTIVE:
        useAuthStore.getState().setAccessToken(token);
        navigation.navigate('Tabs', {
          screen: 'Home',
        });
        break;
      default:
        navigation.navigate('Tabs', {
          screen: 'Settings',
        });
        break;
    }
  };

  return {
    navigateByStatus,
  };
};

export default useLogin;
