import React from "react";
import {
  Alert,
  AppRegistry,
  AsyncStorage,
  Button,
  StyleSheet,
  State,
  Slider,
  Text,
  TextInput,
  Time,
  ToastAndroid,
  View
} from "react-native";

var STORAGE_KEY = "@MySuperStore:key";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      coletar: 0,
      status: "inativo",
      intervalo: 5,
      tempo: 1000,
      locationsArray: {
        locations: []
      },
      ultima: "",
      host: "http://meusite.com.br"
    };
  }

  loadData() {
    if (this.state.locationsArray.lenght > 0) {
      return true;
    }
    try {
      var value = AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null) {
        this.setState({
          locationsArray: {
            locations: JSON.parse(value)
          }
        });
        this.logs("Recovered selection from disk: " + value);
      }
    } catch (error) {
      this.logs("AsyncStorage error: " + error.message);
    }
  }

  //Coleta
  atualizaTempo() {
    let valor = this.state.intervalo * 1000;
    this.setState({ tempo: valor });
  }

  inicializa() {
    this.setState({ coletar: 1 });
    this.atualizaTempo();
    this.loadData();

    setTimeout(() => {
      this.logs("Coleta iniciada");
      this.setState({ status: "leitura" });
      this.coletar();
    }, 1000);
  }

  coletar() {
    let timer = this.state.tempo;
    if (this.state.coletar == 1) {
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          position => {
            var locations = this.state.locationsArray.locations;
            locations.push(position);

            this.setState({
              locations: locations
            });

            position = this.state.locationsArray.locations.lenght;
            console.log(position)
            this.setState({ ultima: position });
          },
          error => this.setState({ error: error.message }),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
        this.coletar();
      }, timer);
    }
  }

  finaliza() {
    this.setState({ coletar: 0 });
    this.setState({ status: "inativa" });
    this._saveLocationStorage(
      JSON.stringify(this.state.locationsArray.locations)
    );
    this.logs("Coleta encerrada");
  }

  _saveLocationStorage = async locations => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, locations);
      this.logs("Saved selection to disk: " + locations);
    } catch (error) {
      this.logs("AsyncStorage error: " + error.message);
    }
  };

  //Envio
  enviar() {
    this.loadData();
    var value = this.state.locationsArray;
    if (value.lenght > 0) {
      this.logs("Dados a enviar");
      return this.send(value);
    }
    this.logs("Nenhum dado a enviar");
    return false;
  }

  send(dados) {
    var host = this.state.host;
    return fetch(host, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dados: dados
      })
    });
  }

  //Toast
  toast(val) {
    ToastAndroid.show(val + " segundos", ToastAndroid.SHORT);
  }

  logs(mensagem) {
    ToastAndroid.show(mensagem, ToastAndroid.SHORT);
    console.log(mensagem);
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.textos}>
          <Text>Coletor de dados GPS</Text>
        </View>
        <View style={styles.intervaloColeta}>
          <Text>Intervalo da coleta: {this.state.intervalo} s</Text>
          <Slider
            style={{ width: 300 }}
            step={1}
            minimumValue={5}
            maximumValue={40}
            value={this.state.intervalo}
            onValueChange={val => this.setState({ intervalo: val })}
            onSlidingComplete={val => this.getVal(val)}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button onPress={this.inicializa.bind(this)} title="Iniciar" />
          <Button
            onPress={this.finaliza.bind(this)}
            title="Encerrar"
            color="#FF2828"
          />
        </View>
        <View style={styles.textContainer}>
          <Text>Status da leitura: {this.state.status}</Text>
          <Text>Ultima posição: {this.state.ultima}</Text>
        </View>
        <View style={styles.sendContainer}>
          <TextInput
            style={{ height: 40 }}
            onChangeText={text => this.setState({ host: text })}
          />
          <Button
            onPress={this.enviar.bind(this)}
            title="Enviar"
            color="#a0e660"
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 50
  },
  textos: {
    alignItems: "center"
  },
  intervaloColeta: {
    padding: 20,
    alignItems: "center",
    flexDirection: "column"
  },
  buttonContainer: {
    margin: 20,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  sendContainer: {
    margin: 20,
    justifyContent: "space-between"
  }
});
