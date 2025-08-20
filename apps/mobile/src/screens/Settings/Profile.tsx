import { View, Text, StyleSheet } from 'react-native';
import {
  authControllerDeleteAccount,
  authControllerSignOut,
  userControllerGetUserProfile,
} from '@repo/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import Loading from '../../components/common/Loading';
import Toast from '@/components/common/Toast';
import TouchableButton from '@/components/common/TouchableButton';

const Profile = () => {
  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: data => data.data.data,
  });

  const { mutate: signOut } = useMutation({
    mutationFn: authControllerSignOut,
    onSuccess: () => {
      useAuthStore.getState().setAccessToken(null);
      Loading.close();
      Toast.show('로그아웃에 성공했습니다.');
    },
    onError: () => {
      Loading.close();
      Toast.show('로그아웃에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const { mutate: deleteAccount } = useMutation({
    mutationFn: authControllerDeleteAccount,
    onSuccess: () => {
      useAuthStore.getState().setAccessToken(null);
      Loading.close();
      Toast.show('회원 탈퇴에 성공했습니다.');
    },
    onError: () => {
      Loading.close();
      Toast.show('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleDeleteAccount = () => {
    Loading.show();
    deleteAccount();
  };

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View>
        <Text>{userProfile?.isBiz ? '사업자' : '일반 사용자'}</Text>
        <Text>{userProfile?.name}</Text>
        <Text>{userProfile?.email}</Text>
      </View>

      <TouchableButton
        label="로그아웃"
        onPress={() => {
          Loading.show();
          signOut();
        }}
      />

      <TouchableButton label="회원 탈퇴" onPress={handleDeleteAccount} />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
});
