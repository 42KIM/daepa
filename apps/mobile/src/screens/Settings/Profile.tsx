import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  authControllerSignOut,
  userControllerGetUserProfile,
} from '@repo/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import Loading from '../../components/common/Loading';
import Toast from '@/components/common/Toast';

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

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <Text>{userProfile?.isBiz ? '사업자' : '일반 사용자'}</Text>
      <Text>{userProfile?.name}</Text>
      <Text>{userProfile?.email}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Loading.show();
          signOut();
        }}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    height: 52,
    backgroundColor: 'black',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
