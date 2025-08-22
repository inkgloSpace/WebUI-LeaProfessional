// Ubah ampIP dengan alamat amplifier LEA
const ampIP = '192.168.0.0';
const ampPort = 1234;
const ampWs = new WebSocket(`ws://${ampIP}:${ampPort}`);
let messageId = 1;

// Saat koneksi terbuka, subscribe ke output untuk channel 1-4
ampWs.onopen = () => {
  console.log("InkgloSpace Was Here!");
  for (let ch = 1; ch <= 4; ch++) {
    subscribeToChannel(ch, "output");
    subscribeToChannel(ch, "levels");
    subscribeToChannel(ch, "inputSelector");
    subscribeToGenerator();

  }
};

// Tangani error koneksi
ampWs.onerror = error => {
  console.error("WebSocket Error:", error);
};

// Tangani pesan masuk dari amplifier
ampWs.onmessage = event => {
  //console.log("Message from amp:", event.data);
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch (e) {
    //console.error("Invalid JSON:", event.data);
    return;
  }
  // Jika pesan merupakan notifikasi (notify), perbarui UI
  if (msg.method === "notify") {
    handleNotifyOut(msg);
    handleNotifyLv(msg);
    handleNotifyInSelector(msg);
    handleNotifyGenerator(msg);
  } else {
    //console.log("Response:", msg);
  }
};

//---------------------------------------------------------------------------------//

//Fungsi untuk subscribe ke properti pada suatu channel amplifier.
//Contoh: subscribe ke "/amp/channels/1/output" untuk channel 1.

function subscribeToChannel(channel, target) {
  const req = {
    leaApi: "1.0",
    url: `/amp/channels/${channel}/${target}`,
    method: "subscribe",
    params: {},
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

function subscribeToGenerator() {
  const req = {
    leaApi: "1.0",
    url: "/amp/signalGenerator",
    method: "subscribe",
    params: {},
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

//-------------------- Event Notify Untuk Update UI --------------------//

//Jika pesan berisi data output channel, perbarui indikator ready dan level fader.
function handleNotifyOut(msg) {
  if (
    msg.method === "notify" &&
    msg.params &&
    msg.params.amp &&
    msg.params.amp.channels
  ) {
    const channels = msg.params.amp.channels;
    // loop setiap channel
    for (let ch in channels) {
      if (channels.hasOwnProperty(ch)) {
        const data = channels[ch].output;
        if (data) {
          // Jika data memiliki properti "ready", update status ready
          if (typeof data.ready === "boolean") {
            //console.log(`Channel ${ch} is ${data.ready ? "READY" : "NOT READY"}`);
            setChannelReady(parseInt(ch), data.ready);
          }
          // Jika data memiliki properti "fader", update nilai fader
          if (typeof data.fader !== "undefined") {
            setFader(parseInt(ch), data.fader);
          }
          if (typeof data.clip === "boolean") {
            //console.log(`Channel ${ch} is ${data.clip ? "CLIP" : "NOT CLIP"}`);
            setClipOn(parseInt(ch), data.clip);
          }
        }
      }
    }
  }
}

//Jika pesan berisi data levels channel, perbarui indikator audio meter.
function handleNotifyLv(msg) {
  if (
    msg.method === "notify" &&
    msg.params &&
    msg.params.amp &&
    msg.params.amp.channels
  ) {
    const channels = msg.params.amp.channels;
    // loop setiap channel
    for (let ch in channels) {
      if (channels.hasOwnProperty(ch)) {
        const data = channels[ch].levels;
        if (data) {
          // Jika data memiliki properti "level_dB", update level audio meter
          if (typeof data.level_db !== "undefined") {
            const percent = ((data.level_db + 60) / 60) * 100;
            updateInputLevel(parseInt(ch), percent);
            //console.log(`Channel ${ch}: level_db updated to ${data.level_db} dB (${percent}%)`);
          }
        }
      }
    }
  }
}

function handleNotifyInSelector(msg) {
  if (
    msg.method === "notify" &&
    msg.params &&
    msg.params.amp &&
    msg.params.amp.channels
  ) {
    const channels = msg.params.amp.channels;
    // loop setiap channel
    for (let ch in channels) {
      if (channels.hasOwnProperty(ch)) {
        const data = channels[ch].inputSelector;
        if (data) {
          // Jika data memiliki properti "ready", update status ready
          if (typeof data.signalGeneratorEnable === "boolean") {
            //console.log(`Channel ${ch} is ${data.signalGeneratorEnable ? "ENABLED" : "DISABLED"}`);
            setGenEnable(parseInt(ch), data.signalGeneratorEnable);
          }
          // Jika data memiliki properti "fader", update nilai fader
          if (typeof data.signalGeneratorFader !== "undefined") {
            setFaderGen(parseInt(ch), data.signalGeneratorFader);
          }
        }
      }
    }
  }
}

function handleNotifyGenerator(msg) {
  if (
    msg.method === "notify" &&
    msg.params &&
    msg.params.amp &&
    msg.params.amp.signalGenerator
  ) {
    const data = msg.params.amp.signalGenerator;
    // Periksa apakah data memiliki properti "type"
    if (data && typeof data.type !== "undefined") {
      //console.log(`Signal generator type is ${data.type}`);
      updateSignalGeneratorType(data.type);
    }
  }
}


//Fungsi untuk mengupdate elemen select "typeSelect" dengan nilai yang diterima.
function updateSignalGeneratorType(type) {
  const selectElement = document.getElementById("typeSelect");
  if (selectElement) {
    selectElement.value = type;
    //console.log(`Updated signal generator type to: ${type}`);
  } else {
    //console.warn("Elemen select 'typeSelect' tidak ditemukan.");
  }
}

//Fungsi untuk memperbarui indikator "ready" pada UI (titik hijau).
function setChannelReady(channelIndex, isOn) {
  //console.log(`Updating channel ${channelIndex} ready status to: ${isOn}`);
  const cards = document.querySelectorAll('.channel-card');
  if (cards.length < channelIndex) {
    //console.warn(`Channel card untuk channel ${channelIndex} tidak ditemukan.`);
    return;
  }
  const dot = cards[channelIndex - 1].querySelector('.dot-ready');
  if (!dot) {
    //console.warn(`Elemen .dot-ready tidak ditemukan pada channel ${channelIndex}.`);
    return;
  }
  if (isOn) {
    dot.classList.add('on');
    //console.log(`Channel ${channelIndex}: dot-ready activated.`);
  } else {
    dot.classList.remove('on');
    //console.log(`Channel ${channelIndex}: dot-ready deactivated.`);
  }
}

//Fungsi untuk memperbarui fader hasil notify
function setFader(channel, faderValue) {
  const slider = document.getElementById(`volume-ch${channel}`);
  const display = document.getElementById(`faderDisplay-ch${channel}`);
  if (slider) {
    slider.value = faderValue;
  }
  if (display) {
    display.textContent = `${faderValue.toFixed(1)} dB`;
  }
  //console.log(`Channel ${channel}: fader updated to ${faderValue} dB`);
}

//Fungsi untuk memperbarui level audio input pada UI.
function updateInputLevel(channelIndex, levelPercent) {
  const bar = document.getElementById(`inputLevel-ch${channelIndex}`);
  bar.style.width = levelPercent + '%';
}



//Fungsi untuk memperbarui status enable dari signal generator.
function setGenEnable(channel, enable) {
  // Cari elemen tombol berdasarkan id, misalnya "signalToggleBtn-ch1" untuk channel 1
  const btn = document.getElementById(`signalToggleBtn-ch${channel}`);
  if (!btn) {
    //console.warn(`Tombol untuk channel ${channel} tidak ditemukan.`);
    return;
  }
  
  if (enable) {
    btn.classList.add("enable");
    btn.classList.remove("disable");
    btn.textContent = "Enabled";
  } else {
    btn.classList.add("disable");
    btn.classList.remove("enable");
    btn.textContent = "Disabled";
  }
  
  //console.log(`Channel ${channel}: signalGeneratorEnable updated to ${enable}`);
}


//Fungsi untuk memperbarui nilai fader signal generator.
function setFaderGen(channel, faderValue) {
  // Cari elemen slider untuk signal generator di channel tersebut
  const slider = document.getElementById(`sgGain-ch${channel}`);
  // Jika Anda memiliki elemen display untuk nilai fader, misalnya:
  const display = document.getElementById(`faderDisplay-sg-ch${channel}`);
  
  if (slider) {
    slider.value = faderValue;
  } else {
    //console.warn(`Slider signal generator untuk channel ${channel} tidak ditemukan.`);
  }
  
  if (display) {
    display.textContent = `${faderValue.toFixed(1)} dB`;
  }
  
  //console.log(`Channel ${channel}: signalGeneratorFader updated to ${faderValue} dB`);
}


//-------------------- Fitur tambahan --------------------//


//Fungsi untuk memperbarui nilai peak.
//Objek untuk menyimpan interval per channel
const clipIntervals = {};

//Fungsi untuk mengatur indikator clip dan mengurangi nilai fader secara berkala selama clip tetap aktif.
function setClipOn(channel, clipStatus) {
  const indicator = document.getElementById(`peakIndicator-ch${channel}`);
  if (!indicator) {
    //console.warn(`Clip indicator untuk channel ${channel} tidak ditemukan.`);
    return;
  }
  
  if (clipStatus) {
    indicator.classList.add("on");
    //console.log(`Channel ${channel}: clip activated.`);
    
    // Jika belum ada interval aktif untuk channel ini, mulai interval baru
    if (!clipIntervals[channel]) {
      clipIntervals[channel] = setInterval(() => {
        const slider = document.getElementById(`volume-ch${channel}`);
        if (slider) {
          let currentFader = parseFloat(slider.value);
          let newFader = currentFader - 10;
          if (newFader < -80) newFader = -80;
          
          setOutGain(channel, newFader);
          //console.log(`Channel ${channel}: fader decreased from ${currentFader} dB to ${newFader} dB due to continuous clip detection.`);
        }
      }, 1000); // interval 1 detik; sesuaikan sesuai kebutuhan
    }
    
  } else {
    indicator.classList.remove("on");
    //console.log(`Channel ${channel}: clip deactivated.`);
   
    if (clipIntervals[channel]) {
      clearInterval(clipIntervals[channel]);
      clipIntervals[channel] = null;
    }
  }
}




//-------------------- Event Listeners untuk UI --------------------//

// Event listener untuk slider volume tiap channel
document.querySelectorAll('input[id^="volume-ch"]').forEach(slider => {
  slider.addEventListener('input', function() {
    const channel = parseInt(this.id.replace("volume-ch", ""));
    const value = parseFloat(this.value);
    // Update tampilan teks secara langsung
    const display = document.getElementById(`faderDisplay-ch${channel}`);
    if (display) {
      display.textContent = `${value.toFixed(1)} dB`;
    }
    // Kirim perintah ke amplifier
    setOutGain(channel, value);
  });
});

// Fungsi atur out gain
function setOutGain(channel, value) {
  const req = {
    leaApi: "1.0",
    url: `/amp/channels/${channel}/output`,
    method: "set",
    params: { "fader": value },
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

document.querySelectorAll('button[id^="signalToggleBtn-ch"]').forEach(btn => {
  btn.addEventListener("click", function() {
    const channel = parseInt(this.id.replace("signalToggleBtn-ch", ""));
    // klo tombol masih  "disable", artinya kita mau meng-enable
    const enable = this.classList.contains("disable");
    
    if (enable) {
      this.classList.remove("disable");
      this.classList.add("enable");
      this.textContent = "Enabled";
    } else {
      this.classList.remove("enable");
      this.classList.add("disable");
      this.textContent = "Disabled";
    }

    // Kirim set boolean yang sesuai untuk channel yang dipilih
    setGen(channel, enable);
  });
});

// Fungsi set generator dengan parameter enable/disable untuk channel
function setGen(channel, enable) {
  const req = {
    leaApi: "1.0",
    url: `/amp/channels/${channel}/inputSelector`,
    method: "set",
    params: { "signalGeneratorEnable": enable },
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

// Event listener untuk dropdown tipe signal generator
document.getElementById("typeSelect").addEventListener("change", function() {
  const type = this.value;
  setGenType(type);
});

//Fungsi seting type dari signal generator
function setGenType(type) {
  const req = {
    leaApi: "1.0",
    url: "/amp/signalGenerator",
    method: "set",
    params: { "type": type },
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

// Event listener untuk slider signal generator gain tiap channel
document.querySelectorAll('input[id^="sgGain-ch"]').forEach(slider => {
  slider.addEventListener('input', function() {
    const channel = parseInt(this.id.replace("sgGain-ch", ""));
    const value = parseFloat(this.value);
    setGenGain(channel, value);
  });
});

// Fungsi atur generator gain
function setGenGain(channel, value) {
  const req = {
    leaApi: "1.0",
    url: `/amp/channels/${channel}/inputSelector`,
    method: "set",
    params: { "signalGeneratorFader": value },
    id: messageId++
  };
  ampWs.send(JSON.stringify(req));
}

