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

var STORAGE = "RealTracesKeys";

export default class App extends React.Component {
  constructor(props)
  {
    super(props);
    this.state = {
      coletar: 0,
      status: "inativo",
      intervalo: 10,
      tempo: 1000,
      locationsArray: {
        locations: []
      },
      ultima: "",
      host: "http://meusite.com.br"
    };
  }

  // Não funciona
  loadData()
  {
    try {
      var value = AsyncStorage.getItem(STORAGE).then(function(){
        if (!(value instanceof Promise)) {
          console.log("loadData");
          console.log(value);
          this.setState({
            locationsArray: {
              locations: JSON.parse(value)
            }
          });
        }
      });
    } catch (error) {
      this.logs("AsyncStorage error: " + error.message);
    }
  }

  //Coleta
  atualizaTempo()
  {
    let valor = this.state.intervalo * 1000;
    this.setState({ tempo: valor });
  }

  inicializa()
  {
    this.setState({ coletar: 1 });
    this.atualizaTempo();
    this.loadData();

    setTimeout(() => {
      this.logs("Iniciando leitura");
      this.setState({ status: "Coletando dados" });
      this.coletar();
    }, 1000);
  }

  coletar()
  {
    let timer = this.state.tempo;
    if (this.state.coletar == 1) {
      setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
           (position) =>
           {
            let locations = this.state.locationsArray.locations;
            locations.push(position);
            console.log("Adicionando");
            this.setState({
              locations: locations
            });
            position = this.state.locationsArray.locations.length;
            this.setState({ ultima: position });
            this.logs("Posição coletada");
          },
          (error) =>
          {
            console.log(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 1000
          }
        );
        this.coletar();
      }, timer);
    }
  }

  finaliza()
  {
    this.setState({ coletar: 0 });
    this.setState({ status: "inativa" });
    this.logs("Coleta encerrada");
    this.logs("Posições coletadas : " + this.state.locationsArray.locations.length);
    this._saveLocationStorage(
      JSON.stringify(this.state.locationsArray.locations)
    );

  }

  _saveLocationStorage = async locations => {
    try {
      await AsyncStorage.setItem(STORAGE, locations).then(function(){
        console.log(locations);
        this.logs("Saved selection to disk");
      });
    } catch (error) {
      this.logs("AsyncStorage error: " + error.message);
    }
  };

  //Envio
  enviar()
  {
    console.log("Enviar");
    this.loadData();
    //let value = this.state.locationsArray;
    try {
      var value = AsyncStorage.getItem(STORAGE).then(function(){
        if (!(value instanceof Promise)) {
          if (value.length > 0) {
            this.logs("Dados a enviar");
            return this.send(value);
          }
          this.logs("Nenhum dado a enviar");
        }
      });
    } catch (error) {
      this.logs("AsyncStorage error: " + error.message);
    }

    return false;
  }

  send(dados)
  {
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
  toast(val)
  {
    ToastAndroid.show(val + " segundos", ToastAndroid.SHORT);
  }

  logs(mensagem)
  {
    ToastAndroid.show(mensagem, ToastAndroid.SHORT);
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
            minimumValue={7}
            maximumValue={30}
            value = {this.state.intervalo}
            onValueChange = {(val) => this.setState({intervalo: val})}
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
        </View>
        <View style={styles.textContainer}>
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
