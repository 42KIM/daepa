import { Platform } from 'react-native';
import appleAuth, {
  //   appleAuthAndroid,
  AppleButton,
} from '@invertase/react-native-apple-authentication';
import { useMutation } from '@tanstack/react-query';
import {
  authControllerAppleNative,
  authControllerGetToken,
  UserDtoStatus,
} from '@repo/api-client';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';

const AppleLoginButton = () => {
  const { navigateByStatus } = useLogin();
  const isAndroid = Platform.OS === 'android';

  const { mutate: mutateGetToken } = useMutation({
    mutationFn: async (_status: UserDtoStatus) => {
      return authControllerGetToken();
    },
    onSuccess: async (data, status) => {
      navigateByStatus({ status, token: data.data.token });

      Loading.close();
      Toast.show('로그인에 성공했습니다.');
    },
    onError: () => {
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const { mutate: appleLogin } = useMutation({
    mutationFn: authControllerAppleNative,
    onSuccess: data => {
      mutateGetToken(data.data.status);
    },
    onError: error => {
      console.log(error);
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleAppleLoginOnAndroid = async () => {
    Loading.show();

    try {
      // const REDIRECT_URI = `${getMobileWebHost()}/social-login`;
      //   appleAuthAndroid.configure({
      //     clientId: '',
      //     redirectUri: REDIRECT_URI,
      //     responseType: appleAuthAndroid.ResponseType.ALL,
      //     scope: appleAuthAndroid.Scope.ALL,
      //     nonce: data?.result,
      //   });
      //   const appleAuthRequestResponse = await appleAuthAndroid.signIn();
      //   const { code, id_token, state, nonce } = appleAuthRequestResponse;
    } catch (e: any) {
      console.log(e);
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleAppleLoginOnIOS = async () => {
    Loading.show();

    try {
      const body = {
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
        nonceEnabled: true,
      };

      const appleAuthRequestResponse = await appleAuth.performRequest(body);

      const { email, identityToken, authorizationCode, nonce } =
        appleAuthRequestResponse;

      if (identityToken) {
        appleLogin({
          identityToken,
          email: email ?? undefined,
          authorizationCode: authorizationCode ?? undefined,
          nonce: nonce ?? undefined,
        });
      }
    } catch (e: any) {
      console.log(e);
      Loading.close();
    }
  };

  return (
    <AppleButton
      buttonType={AppleButton.Type.SIGN_IN}
      buttonStyle={AppleButton.Style.BLACK}
      cornerRadius={5}
      style={{ width: 200, height: 50 }}
      onPress={isAndroid ? handleAppleLoginOnAndroid : handleAppleLoginOnIOS}
    />
  );
};

export default AppleLoginButton;
