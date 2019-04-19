/* @flow */
import * as React from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  PermissionsAndroid
} from 'react-native';
import {
  Header
} from 'react-navigation';
import {
  TextInput,
  Button,
  withTheme,
  Appbar,
  Dialog,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import {title} from '../settings';
import axios from "axios";
import moment from 'moment'

async function requestCameraAndAudioPermission() {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the camera');
    } else {
      console.log('Camera permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
}

type Props = {
  theme: Theme,
  navigation: any,
};

type State = {
  text: string,
};

export class Index extends React.Component<Props, State> {

  static navigationOptions = {
    header: (
      <Appbar.Header>
        <Appbar.Content title={title} />
      </Appbar.Header>
    )
  };

  state = {
    text: '',
    visible: false,
    message: null,
    inProgress: false,
    error: null,
  };

  _hideDialog = () => {
    this.setState({
      visible: false,
      message: null
    });
  }

  componentWillMount () {
    if (Platform.OS === 'android') {
      requestCameraAndAudioPermission().then(_ => {

      });
    }
  }
  handleGetToken = () => {
    const { text } = this.state
    this.setState({ inProgress: true })
    axios.get(
      'https://agora-poc.herokuapp.com/access_token', {
        params: {
          channel: text,
          expiredTs: moment().add(5, 'minutes').unix(),
        }
      }
    )
      .then(({ data }) => {
        this.setState({ token: data.token, error: false, inProgress: false }, this.handleNavigateToCall)
      })
      .catch(err => {
        console.log(err)
        this.setState({ inProgress: false, error: true })
      })
  }

  handleNavigateToCall = () => {
    const { navigate } = this.props.navigation;
    const { token, text } = this.state
    navigate("agora", {
      channelName: text,
      token,
      onCancel: (message) => {
        this.setState({
          visible: true,
          message
        });
        console.log('[agora]: onCancel ', message);
      }
    })
  }

  render() {
    const {
      theme: {
        colors: { background },
      },
    } = this.props;

    const { state, navigate } = this.props.navigation;
    const { inProgress, error } = this.state
    return (
      <KeyboardAvoidingView
        style={styles.wrapper}
        keyboardVerticalOffset = {Platform.select({ios: 0, android: Header.HEIGHT + 64})}
        behavior= {(Platform.OS === 'ios')? "padding" : null}
        keyboardVerticalOffset={80}
      >
        <Dialog
          visible={this.state.visible}
          onDismiss={this._hideDialog}>
          <Dialog.Title>Alert</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{this.state.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={this._hideDialog}>Done</Button>
          </Dialog.Actions>
        </Dialog>
        <ScrollView
          style={[styles.container, { backgroundColor: background }]}
          keyboardShouldPersistTaps={'always'}
          removeClippedSubviews={false}
        >
          <TextInput
            style={styles.inputContainerStyle}
            label="Channel name"
            value={this.state.text}
            onChangeText={text => this.setState({ text })}
          />
          <Button style={styles.buttonContainerStyle} onPress={this.handleGetToken}>
            join channel
          </Button>
          <View style={styles.actionContainerStyle}>
            {inProgress ? <ActivityIndicator animating={true} /> : error ? (

                <Text style={styles.contenStyle}>Connection error. Please try again</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  colors: {
    backgroundColor: "#757575"
  },
  container: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    flexDirection: 'column',
  },
  wrapper: {
    flex: 1,
  },
  inputContainerStyle: {
    backgroundColor: '#F5F5F5',
    margin: 8,
    flex: 2
  },
  buttonContainerStyle: {
    flex: 2
  },
  actionContainerStyle: {
    marginTop: 10,
  },
  contenStyle : {
    textAlign: 'center',
    color: '#be121f',
  }
});

export default withTheme(Index);
