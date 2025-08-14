import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface TopBarProps {
  title?: string;
  textButtonLabel?: string;
  textButtonPressed?: () => void;
}

const TopBar = ({
  title = '',
  textButtonLabel = '',
  textButtonPressed = () => {},
}: TopBarProps) => {
  const navigation = useNavigation();

  const onLeftButtonPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftButtonContainer}>
        <View style={styles.leftButtonContainer}>
          <Pressable onPress={onLeftButtonPress}>
            <Text>뒤로</Text>
          </Pressable>
        </View>
      </View>

      {!!title && <Text>{title}</Text>}

      <View style={styles.rightButtonContainer}>
        {!!textButtonLabel && (
          <Pressable onPress={textButtonPressed}>
            <Text>{textButtonLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftIcon: {
    width: 24,
    height: 24,
  },
  leftButtonContainer: {
    width: 40,
  },
  rightButtonContainer: {
    width: 40,
  },
});

// interface LeftButtonStyle {
// 	width: string;
// }

// interface ContainerStyle {
// 	isWeb: boolean;
// }

// const Container = styled.View<ContainerStyle>`
// 	width: 100%;
// 	height: 56px;
// 	background-color: ${(props) => props.theme.base.white};
// 	justify-content: space-between;
// 	top: 0px;
// 	flex-direction: row;
// 	align-items: center;
// 	padding: 0 16px;
// 	${(props) =>
// 		props.isWeb &&
// 		css`
// 			max-width: ${WEB_MAX_WIDTH}px;
// 		`}
// `;

// const TextButton = styled(TX.L14)`
// 	width: 68px;
// 	color: ${(props) => props.theme.base.grey500};
// 	text-align: right;
// 	margin-left: 16px;
// `;

// const LeftButtonContainer = styled.View<LeftButtonStyle>`
// 	flex-direction: row;
// 	justify-content: flex-start;
// 	align-items: center;
// 	width: ${(props) => props.width}px;
// `;

// const RightButtonContainer = styled.View`
// 	flex-direction: row;
// 	justify-content: flex-end;
// 	align-items: center;
// 	min-width: 40px;
// `;

// const RightButton = styled(GetchaTouchable)`
// 	margin-left: 16px;
// `;

// const Title = styled(TX.H16)`
// 	flex: 1;
// 	text-align: center;
// `;
