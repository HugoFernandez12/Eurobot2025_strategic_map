import React, { useState, useRef, useEffect } from "react";
import FileReader from 'react-file-reader';
import Sidebar from "./Sidebar";
import "./styles.css";

const App = () => {
  /*-----------------------------------------------*/
  /*-------------DATOS-DE-NEXUS--------------------*/
  /*-----------------------------------------------*/
  const diametroRuedaNexus = 6.4;
  const distanciaRuedasNexus = 21.6;
  const pulsosPorVueltaNexus = 213;
  const circunferenciaRuedaNexus = 2 * Math.PI * (diametroRuedaNexus/2);
  const circunferenciaNexus = 2 * Math.PI * (distanciaRuedasNexus/2);
  const diametroNexus = 30;

  const _1paso_cm = pulsosPorVueltaNexus/circunferenciaRuedaNexus;
  const _1cm_paso = circunferenciaRuedaNexus/pulsosPorVueltaNexus;
  const _1grado_cm = circunferenciaNexus/360;
  const _1cm_grado = 360/circunferenciaNexus;

  /*-----------------------------------------------*/
  /*----DEFINE-LOS-ESTADOS-DE-LA-APLICACION--------*/
  /*-----------------------------------------------*/

  const canvasRef = useRef(""); // Referencia para el canvas
  const [strategy, setStrategy] = useState(null);
  const [estimation, setEstimation] = useState(null);

  const [clickHistory, setClickHistory] = useState([]); // Historial de coordenadas clicadas
  const [point, setPoint] = useState({
    corX: 0,
    corY: 0,
    tiempo: 0,
    stop: 0,
    angle: 0,
    direccion: 0,
    recogerZonaConstruccion: 0,
    soltarLaterales: 0,
    secuenciaConstruccion: 0,
    soltarTodo: 0,
  });

  const [isCaptureMode, setIsCaptureMode] = useState(true); // Controla si estamos en el modo de captura
  const [isEditingMode, setIsEditingMode] = useState(false); // Controla el modo de edición

  const [isAddingLineMode, setIsAddingLineMode] = useState(false); // Controla el modo de agregar linea

  const [selectedLine, setSelectedLine] = useState(null); // Almacena la línea seleccionada
  const [selectedPointIndex, setSelectedPointIndex] = useState(null); // Almacena el índice del punto seleccionado

  const [isDragging, setIsDragging] = useState(false); // Controla si se está arrastrando un punto

  const [isVisible, setIsVisible] = useState(false);

  const [state, setState] = useState("neutral");

  const [cursorClase, setCursorClase] = useState('cursor-normal'); // Clase inicial para el cursor

  /*-----------------------------------------------*/
  /*------MANEJA-EL-CLICK-Y-LAS-COORDENADAS--------*/
  /*-----------------------------------------------*/

  const handleClick = (event) => {
    if (!isCaptureMode && !isAddingLineMode) return; // Si no está en modo captura, no hacer nada

    const rect = event.currentTarget.getBoundingClientRect(); // Obtener las dimensiones del rectángulo
    const x = Math.round(event.clientX - rect.left); // Calcular y redondear la coordenada X dentro del rectángulo
    const y = Math.round(event.clientY - rect.top); // Calcular y redondear la coordenada Y dentro del rectángulo

    // Asegurarnos de que las coordenadas están dentro de los límites del rectángulo
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const newPoint = {
        ...point, // Copiar todas las propiedades actuales
        corX: x, // Actualizar solo corX
        corY: y, // Actualizar solo corY
      };

      if (isAddingLineMode) {
        encontrarIndices(newPoint);
      } else {
        // Añadir el nuevo objeto con las coordenadas actualizadas al historial
        setClickHistory((prevHistory) => [...prevHistory, newPoint]);
      }

      // Actualizar el estado de point
      setPoint(newPoint);
    }
  };

  /*-----------------------------------------------*/
  /*-------GESTIONA-LOS-ESTADOS--------------------*/
  /*-----------------------------------------------*/

  // Función para borrar el historial y los puntos
  const handleReset = () => {
    setClickHistory([]);
    setSelectedLine(null); // Reiniciar la línea seleccionada
    setSelectedPointIndex(null); // Reiniciar el punto seleccionado
  };

  // Función para habilitar la captura de coordenadas
  const enableCapture = () => {
    setIsCaptureMode(true);
    setIsAddingLineMode(false);
    setIsEditingMode(false); // Deshabilitar el modo de edición
    setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
    setSelectedPointIndex(null); // Limpiar el punto seleccionado
  };

  // Función para habilitar el modo de edición
  const enableEditMode = () => {
    setIsEditingMode(true);
    setIsCaptureMode(false);
    setIsAddingLineMode(false);
    setSelectedPointIndex(null); // Limpiar el punto seleccionado al cambiar de modo
    setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
  };

  const enableAddingLine = () => {
    setIsAddingLineMode(true);
    setIsEditingMode(false);
    setIsCaptureMode(false);
  };

  // Función para alternar el estado entre 'off', 'neutral' y 'on'
  const toggleTeamState = () => {
    if (state === "blue") {
      setState("neutral");
    } else if (state === "neutral") {
      setState("yellow");
    } else {
      setState("blue");
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  /*-----------------------------------------------*/
  /*------ENCUENTRA-EL-INDICE-DE-DOS-PUNTOS--------*/
  /*-----------------------------------------------*/

  const encontrarIndices = (punto) => {
    for (let i = 0; i < clickHistory.length - 1; i++) {
      if (
        clickHistory[i].corX === selectedLine.start.corX &&
        clickHistory[i].corY === selectedLine.start.corY &&
        clickHistory[i + 1].corX === selectedLine.end.corX &&
        clickHistory[i + 1].corY === selectedLine.end.corY
      ) {
        const nuevoClickHistory = [...clickHistory];

        // Inserta el nuevo punto en la copia
        nuevoClickHistory.splice(i + 1, 0, punto);

        // Actualiza el estado con la nueva copia del array
        setClickHistory(nuevoClickHistory);
        setIsAddingLineMode(false);
        setIsEditingMode(true);
        return;
      }
    }
  };

  /*-----------------------------------------------*/
  /*------GESTIONA-LOS-JSONS-----------------------*/
  /*-----------------------------------------------*/
  const createJson = () => {
    let puntos = {};
  
    for (let i = 0; i < clickHistory.length; i++) {
      let distance = -1;
      let rotation = -1;

      if (clickHistory.length !== i + 1) {
        distance = calculateDistance(clickHistory[i].corX,clickHistory[i+1].corX,clickHistory[i].corY,clickHistory[i+1].corY);
        //distance = distance * _1paso_cm;
      }

      //if (i!==0){
      if (clickHistory.length >= i + 2 ) {
        rotation = calcularAngulo(i);
        //rotation = Math.round(rotation) - clickHistory[i].angle;
      }
      //}
      

      const newPoint = {
        x: Math.round(clickHistory[i].corX/3),
        y: Math.round(clickHistory[i].corY/3),
        distancia: Math.round(distance),
        tiempo: clickHistory[i].tiempo,
        parada: clickHistory[i].stop,
        giroEje: clickHistory[i].angle,
        direccion: clickHistory[i].direccion,
        angulo: Math.round(rotation),
        recogerZonaConstruccion: clickHistory[i].recogerZonaConstruccion,
        soltarLaterales: clickHistory[i].soltarLaterales,
        secuenciaConstruccion: clickHistory[i].secuenciaConstruccion,
        soltarTodo: clickHistory[i].soltarTodo,
      };
  
      const nombre = `Punto${i}`;
  
      puntos[nombre] = newPoint;
    }
  
    const resultadoJSON = {
      [estimation]: puntos,
    };
  
    const jsonString = JSON.stringify(resultadoJSON, null, 2);
  
    return jsonString;
  };
  
  const sendJson = () => {
    const datos = createJson();

    let character;
    if ( state === "yellow" ) {
      character = "Y";
    } 
    else if( state === "blue" ){
      character = "B";
    }
    else {
      character = "N";
    }

    if (!strategy) {
      alert("Debes introducir una estimacion de puntos.");
    }

    const nombreFichero=`${strategy}${character}.json`;
    
    const url = `http://192.168.4.22/guardar?filename=${encodeURIComponent(nombreFichero)}&data=${encodeURIComponent(datos)}`;

    const newWindow = window.open(url, '_blank');
    newWindow.document.close();
    newWindow.close();
  };

  const uploadJson = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      console.error("No se seleccionó ningún archivo.");
      return;
    }

    if (file.type !== "application/json") {
      alert("Por favor, selecciona un archivo JSON válido.");
      return;
    }

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      setClickHistory([]);
      for (const key in jsonData) {
        const puntos = jsonData[key];
        for (const punto in puntos) {
          const { x, y } = puntos[punto];
          const newPoint = {
            corX: x*3,
            corY: y*3,
          };
          setClickHistory((prevItems) => [...prevItems, newPoint]);
        }
      }
    } catch (error) {
      console.error("Error al leer o analizar el archivo JSON:", error);
    }
  };

  const saveJson = () => {
    let character;
    if ( state === "yellow" ) {
      character = "Y";
    } 
    else if( state === "blue" ){
      character = "B";
    }
    else {
      character = "N";
    }


    const fileName = `${strategy}${character}.json`;
  
    const jsonString = createJson();
  
    const blob = new Blob([jsonString], { type: "application/json" });
  
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
  
    link.click();
  
    URL.revokeObjectURL(link.href);
  };

  function calcularAngulo(i) {
    const x2 = clickHistory[i].corX;
    const y2 = clickHistory[i].corY;
    const x3 = clickHistory[i + 1].corX;
    const y3 = clickHistory[i + 1].corY;

    const deltaX = x3 - x2;
    const deltaY = y3 - y2;

    const anguloRadianes = Math.atan2(deltaY, deltaX);

    let anguloGrados = (anguloRadianes * 180) / Math.PI;

    anguloGrados = (anguloGrados + 90) % 360;
    if (anguloGrados < 0) {
      anguloGrados += 360;
    }

    return anguloGrados;
  }

  /*-----------------------------------------------*/
  /*---CAMBIA-EL-NUMERO-DE-LA-ESTRATEGIA-----------*/
  /*-----------------------------------------------*/

  const handleInputChange = (event) => {
    const nuevoValor = event.target.value;
    setStrategy(Number(nuevoValor));
  };

  /*-----------------------------------------------*/
  /*-----CALCULA-LA-DISTANCIA-DE-LA-LINEA----------*/
  /*-----------------------------------------------*/

  const calculateDistance = (p1s,p1e,p2s,p2e) => {
    const distance = Math.round(
      Math.sqrt(
        Math.pow(p1e - p1s, 2) + Math.pow(p2e - p2s, 2)
      ) / 3
    );
    return distance;
  };

  /*-----------------------------------------------*/
  /*-----ELIMINAN-LOS-PUNTOS-CORRESPONDIENTES------*/
  /*-----------------------------------------------*/

  // Función para eliminar un punto
  const handleDeletePoint = (index) => {
    setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
    setSelectedPointIndex(null); // Limpiar el punto seleccionado
    const newPoints = clickHistory.filter((_, i) => i !== index); // Filtrar el array para eliminar el elemento en el índice
    setClickHistory(newPoints); // Actualizar el estado
  };

  // Función para eliminar el último punto
  const handleDeleteLastPoint = () => {
    setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
    setSelectedPointIndex(null); // Limpiar el punto seleccionado
    const newPoints = clickHistory.slice(0, -1); // Crear un nuevo array sin el último elemento
    setClickHistory(newPoints); // Actualizar el estado
  };

  /*-----------------------------------------------*/
  /*-----GESTIONA-LOS-CAMBIOS-EN-LOS-PUNTOS--------*/
  /*-----------------------------------------------*/

  // Función para manejar cambios en x
  const handleChangeX = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].corX = newValue; // Actualizar el valor de x
    setClickHistory(newPoint); // Actualizar el estado
  };

  // Función para manejar cambios en y
  const handleChangeY = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].corY = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeTiempo = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].tiempo = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeStop = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].stop = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeDireccion = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].direccion = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeAngle = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].angle = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeRecogerZonaConstruccion = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].recogerZonaConstruccion = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeSoltarLaterales = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].soltarLaterales = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeSecuenciaConstruccion = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].secuenciaConstruccion = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleChangeSoltarTodo = (index, newValue) => {
    const newPoint = [...clickHistory]; // Hacer una copia del array de puntos
    newPoint[index].soltarTodo = newValue; // Actualizar el valor de y
    setClickHistory(newPoint); // Actualizar el estado
  };

  const handleEstimation = (newValue) => {
    setEstimation(newValue);
  };

  /*-----------------------------------------------*/
  /*-------CAMBIA-EL-ICONO-DEL-RATON---------------*/
  /*-----------------------------------------------*/

  const handleMouseEnter = () => {
    updateCursorClase();
  };

  const handleMouseLeave = () => {
    setCursorClase('cursor-normal'); // Cambia a la clase de cursor normal
  };

  /*-----------------------------------------------*/
  /*---EFECTO-QUE-DIBUJA-LOS-COMPONENTES-----------*/
  /*-----------------------------------------------*/

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Limpiar el canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.lineJoin = "round";
    context.lineCap = "butt"; // Puede ser "butt", "round" o "square"

    // Dibujar las líneas entre los puntos
    if (clickHistory.length > 1) {
      context.globalCompositeOperation = "source-over ";

      // Restauramos la operación de composición predeterminada para dibujar normalmente
      context.globalCompositeOperation = "source-over";

      context.strokeStyle = "rgba(255, 55, 55, 0.7)"; // Color de la línea
      context.lineWidth = 4; // Grosor de la línea
      context.beginPath();
      for (let i = 0; i < clickHistory.length; i++) {
        const point = clickHistory[i];
        if (i === 0) {
          context.moveTo(point.corX, point.corY); // Mover al primer punto
        } else {
          context.lineTo(point.corX, point.corY); // Dibujar línea al siguiente punto
        }
      }
      context.stroke();
    }

    // Dibujar los puntos y sus coordenadas
    clickHistory.forEach((point, index) => {
      context.globalCompositeOperation = "source-over";
      // Dibujar el punto
      context.strokeStyle = "rgba(255, 255, 255, 1)";
      context.lineWidth = 3; // Grosor del contorno del círculo
      context.beginPath();
      /*context.arc(point.x, point.y, 5, 0, Math.PI * 2, true); // Dibujar punto como círculo*/
      context.arc(point.corX, point.corY, ((diametroNexus-1) / 2) * 3, 0, Math.PI * 2, true); // Dibujar punto como círculo
      context.stroke();

      // Dibujar las coordenadas
      context.fillStyle = "rgba(0, 0, 0, 0.8)"; // Color del texto (poco vistoso)
      context.font = "10px Arial"; // Estilo de fuente
      context.fillText(
        `(${Math.round(point.corX / 3)}, ${Math.round(point.corY / 3)})`,
        point.corX + 10,
        point.corY - 10
      ); // Mostrar coordenadas desplazadas
    });
  }, [clickHistory]); // Ejecutar cada vez que clickHistory cambie

  /*-----------------------------------------------*/
  /*-MANEJA-EL-CLICK-EN-EL-CANVA-PARA-SELECCIONAR--*/
  /*-----------------------------------------------*/

  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect(); // Obtener dimensiones del canvas
    const x = Math.round(event.clientX - rect.left); // Coordenada X
    const y = Math.round(event.clientY - rect.top); // Coordenada Y

    // Primero verificar si se hizo clic en un punto
    for (let i = 0; i < clickHistory.length; i++) {
      const point = clickHistory[i];
      const distance = Math.sqrt((point.corX - x) ** 2 + (point.corY - y) ** 2);
      if (distance < (diametroNexus * 3) / 2) {
        // Rango para detectar clic en el punto
        if (isEditingMode) {
          setSelectedPointIndex(i); // Guardar el índice del punto seleccionado
          return; // Salir si se ha encontrado un punto
        }
        return; // Salir si se ha encontrado un punto
      }
    }

    // Si no se hizo clic en un punto, verificar si se hizo clic en una línea
    if (isEditingMode) {
      for (let i = 0; i < clickHistory.length - 1; i++) {
        const p1 = clickHistory[i];
        const p2 = clickHistory[i + 1];
        const distance =
          Math.abs(
            (p2.corY - p1.corY) * x -
              (p2.corX - p1.corX) * y +
              p2.corX * p1.corY -
              p2.corY * p1.corX
          ) / Math.sqrt((p2.corY - p1.corY) ** 2 + (p2.corX - p1.corX) ** 2);

        if (distance < 5) {
          // Rango para detectar clic en la línea
          setSelectedLine({ start: p1, end: p2 }); // Guardar la línea seleccionada
          setSelectedPointIndex(null); // Limpiar el punto seleccionado
          return;
        }
      }
    }

    // Si no se ha clicado en ningún punto o línea, reiniciar las selecciones
    setSelectedLine(null);
    setSelectedPointIndex(null);
  };

  /*-----------------------------------------------*/
  /*--MANEJA-EL-INICIO-DEL-ARRASTRE-DEL-RATON------*/
  /*-----------------------------------------------*/

  const handleMouseDown = (event) => {
    if (!isEditingMode || selectedPointIndex === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    // Verificar si el clic está en el punto seleccionado
    const selectedPoint = clickHistory[selectedPointIndex];

    const distance = Math.sqrt(
      (selectedPoint.corX - x) ** 2 + (selectedPoint.corY - y) ** 2
    );

    if (distance < (circunferenciaNexus / 2) * 3) {
      setIsDragging(true); // Iniciar arrastre
    }
  };

  /*-----------------------------------------------*/
  /*-------MANEJA-EL-MOVIMIENTO-DEL-RATON----------*/
  /*-----------------------------------------------*/

  const handleMouseMove = (event) => {
    if (!isDragging || selectedPointIndex === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    // Actualizar la posición del punto arrastrado
    setClickHistory((prevHistory) => {
      const newHistory = [...prevHistory];

      const newPoint = {
        ...newHistory[selectedPointIndex], // Copiar todas las propiedades actuales
        corX: x, // Actualizar solo corX
        corY: y, // Actualizar solo corY
      };

      newHistory[selectedPointIndex] = newPoint;
      return newHistory;
    });
  };

  /*-----------------------------------------------*/
  /*----------------FIN-ARRASTRE-------------------*/
  /*-----------------------------------------------*/

  const handleMouseUp = () => {
    setIsDragging(false); // Terminar arrastre
  };

  /*-----------------------------------------------*/
  /*----------------GESTIONA-EL-ARRASTRE-----------*/
  /*-----------------------------------------------*/

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
    }

    // Limpiar los event listeners al desmontar el componente
    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [isDragging, selectedPointIndex]);
  
  /*-----------------------------------------------*/
  /*--------CAMBIA-EL-ESTADO-CON-EL-CLIC-----------*/
  /*-----------------------------------------------*/

  useEffect(() => {
    // Función para manejar la pulsación de teclas
    const handleKeyPressEvent = (event) => {
      if (event.key === "z") {
        setIsCaptureMode(true);
        setIsAddingLineMode(false);
        setIsEditingMode(false); // Deshabilitar el modo de edición
        setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
        setSelectedPointIndex(null); // Limpiar el punto seleccionado
      }
      if (event.key === "x") {
        setIsEditingMode(true);
        setIsCaptureMode(false);
        setIsAddingLineMode(false);
        setSelectedPointIndex(null); // Limpiar el punto seleccionado al cambiar de modo
        setSelectedLine(null); // Limpiar la línea seleccionada al cambiar de modo
      }
    };

    // Agregar el listener global al montar el componente
    window.addEventListener("keydown", handleKeyPressEvent);

    // Limpiar el listener al desmontar el componente
    return () => {
      window.removeEventListener("keydown", handleKeyPressEvent);
    };
  }, [
    setIsAddingLineMode,
    setIsEditingMode,
    setIsCaptureMode,
    setSelectedLine,
    setSelectedPointIndex
  ]);

  /*-----------------------------------------------*/
  /*---------ACTUALIZA-EL-CURSOR-------------------*/
  /*-----------------------------------------------*/

  const updateCursorClase = () => {
    if (isCaptureMode) {
      setCursorClase('cursor-personalizado-mover');
    } else if (isEditingMode) {
      setCursorClase('cursor-personalizado-editar');
    } else {
      setCursorClase('cursor-normal');
    }
  };
  
  useEffect(() => {
    updateCursorClase();
  }, [isCaptureMode, isEditingMode]);

  /*-----------------------------------------------*/
  /*----------------BOTONES-OPCIONES---------------*/
  /*-----------------------------------------------*/
  
  return (
    <div>
      <Sidebar
        isCaptureMode={isCaptureMode}
        isEditingMode={isEditingMode}
        enableCapture={enableCapture}
        enableEditMode={enableEditMode}
        handleReset={handleReset}
        sendJson={sendJson}
        saveJson={saveJson}
        uploadJson={uploadJson}
      />
      {/*-----------------------------------------------*/}
      {/*------------------CANVA------------------------*/}
      {/*-----------------------------------------------*/}

      <div className="main-content">
        <div className="title-app-container">
          <h1 className="title-app">Minerva Strategist</h1>
        </div>
        <div className="title-value-container">
          <p className="title-selected-text">Strategia:&nbsp;</p>
          <input className="title-history-input" type="number" value={strategy} onChange={handleInputChange} min={1} max={9}>
          </input>
          <div
            className={`toggle-button`}
            onClick={toggleTeamState}
          >
            <div className={`ball ${state}`}></div>
          </div>
          <p className="title-selected-text">Estimacion:&nbsp;</p>
          <input className="estimation-history-input"
            type="number"
            value={estimation}
            min={0} 
            onChange={(e) =>
              handleEstimation(
                parseInt(e.target.value)
              )
            }>
          </input>
        </div>
        <div className="rectangle" onClick={handleClick}>
          <div
            className={cursorClase}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <canvas
              ref={canvasRef}
              width={900} // Ancho del canvas
              height={600} // Alto del canvas
              style={{
                border: "1px solid black",
                position: "absolute",
                left: 0,
                top: 0,
              }}
              onClick={handleCanvasClick} // Manejar clic en el canvas
            />
            {/* Grid horizontal lines with labels*/}
            {[60, 120, 180, 240, 300, 360, 420, 480, 540].map((y, index) => (
              <div
                key={index}
                className="horizontal-line"
                style={{ top: `${y}px` }}
              >
                <span className="line-label-horizontal">{y / 3}</span>
              </div>
            ))}

            {/* Grid vertical lines with labels */}
            {[
              60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840,
            ].map((x, index) => (
              <div
                key={index}
                className="vertical-line"
                style={{ left: `${x}px` }}
              >
                <span className="line-label-vertical">{x / 3}</span>
              </div>
            ))}
          </div>
        </div>
        {/*-----------------------------------------------*/}
        {/*------------------GRID-------------------------*/}
        {/*-----------------------------------------------*/}

        <div className="grid-options-container">
          {/*-----------------------------------------------*/}
          {/*--------------SELECCIONADO---------------------*/}
          {/*-----------------------------------------------*/}

          <div className="selected-text-container">
            <p className="text-tilte-selected">Componente seleccionado</p>
            {/* Muestra las coordenadas seleccionadas o los puntos de la línea seleccionada */}
            {!isCaptureMode && selectedPointIndex !== null ? (
              <div className="history-point" key={selectedPointIndex}>
                <p className="selected-text">Punto {selectedPointIndex}:</p>
                <div className="key-value-container">
                  <p className="selected-text">X = </p>
                  <input
                    className="history-input"
                    type="number"
                    value={Math.round(
                      clickHistory[selectedPointIndex].corX / 3
                    )}
                    onChange={(e) =>
                      handleChangeX(
                        selectedPointIndex,
                        parseInt(e.target.value) * 3
                      )
                    }
                  />
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Y = </p>
                  <input
                    className="history-input"
                    type="number"
                    value={Math.round(
                      clickHistory[selectedPointIndex].corY / 3
                    )}
                    onChange={(e) =>
                      handleChangeY(
                        selectedPointIndex,
                        parseInt(e.target.value) * 3
                      )
                    }
                  />
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Tiempo = </p>
                  <input
                    className="history-input"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].tiempo)}
                    onChange={(e) =>
                      handleChangeTiempo(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Stop = </p>
                  <input
                    className="history-input"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].stop)}
                    onChange={(e) =>
                      handleChangeStop(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Direccion = </p>
                  <select
                    className="history-select"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].direccion)}
                    onChange={(e) =>
                      handleChangeDireccion(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                    >
                    <option value={0}>horaria</option>
                    <option value={1}>antihoraria</option>
                  </select>
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Angle = </p>
                  <input
                    className="history-input"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].angle)}
                    onChange={(e) =>
                      handleChangeAngle(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Recoger en la zona de construccion = </p>
                  <select
                    className="history-select"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].recogerZonaConstruccion)}
                    onChange={(e) =>
                      handleChangeRecogerZonaConstruccion(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>false</option>
                    <option value={1}>true</option>
                  </select>
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Soltar botes laterales = </p>
                  <select
                    className="history-select"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].soltarLaterales)}
                    onChange={(e) =>
                      handleChangeSoltarLaterales(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>false</option>
                    <option value={1}>true</option>
                  </select>
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Secuencia de construccion = </p>
                  <select
                    className="history-select"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].secuenciaConstruccion)}
                    onChange={(e) =>
                      handleChangeSecuenciaConstruccion(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>false</option>
                    <option value={1}>true</option>
                  </select>
                </div>

                <div className="key-value-container">
                  <p className="selected-text">Soltar todo = </p>
                  <select
                    className="history-select"
                    type="number"
                    value={Math.round(clickHistory[selectedPointIndex].soltarTodo)}
                    onChange={(e) =>
                      handleChangeSoltarTodo(
                        selectedPointIndex,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>false</option>
                    <option value={1}>true</option>
                  </select>
                </div>

                <button onClick={() => handleDeletePoint(selectedPointIndex)}>
                  Eliminar
                </button>
              </div>
            ) : selectedLine ? (
              <div className="history-point">
                <p className="selected-text">
                  Linea: ({Math.round(selectedLine.start.corX / 3)},{" "}
                  {Math.round(selectedLine.start.corY / 3)}) - (
                  {Math.round(selectedLine.end.corX / 3)},{" "}
                  {Math.round(selectedLine.end.corY / 3)})
                </p>
                <p className="selected-text">
                  Distancia: {calculateDistance(selectedLine.start.corX,selectedLine.end.corX,selectedLine.start.corY,selectedLine.end.corY)}
                </p>
                <button onClick={() => enableAddingLine()}>
                  Agrega un nuevo punto
                </button>
              </div>
            ) : (
              <p className="selected-text">-</p>
            )}
          </div>
          {/*-----------------------------------------------*/}
          {/*----------------BOTONES-OPCIONES---------------*/}
          {/*-----------------------------------------------*/}

          <div className="selected-text-container">
            {/* Botón para eliminar el último punto */}
            <button
              className="erase-last-button"
              onClick={handleDeleteLastPoint}
              disabled={clickHistory.length === 0}
            >
              Eliminar Ultimo Punto
            </button>
            <pre>{createJson()}</pre>
          </div>
          {/*-----------------------------------------------*/}
          {/*---------------HISTORIAL-CLICKS----------------*/}
          {/*-----------------------------------------------*/}

          <div className="selected-text-container">
            <div className="show-content-container">
              <button
                className="show-content-button"
                onClick={toggleVisibility}
              >
                {isVisible ? "Ocultar" : "Mostrar"} historial
              </button>
              {isVisible &&
                clickHistory.map((point, index) => (
                  <div className="history-point" key={index}>
                    <p className="selected-text">Punto {index}:</p>
                    {/* Campos de entrada para modificar x e y */}
                    <div className="key-value-container">
                      <p className="selected-text">X = </p>
                      <input
                        className="history-input"
                        type="number"
                        value={Math.round(point.corX / 3)}
                        onChange={(e) =>
                          handleChangeX(index, parseInt(e.target.value) * 3)
                        }
                      />
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Y = </p>
                      <input
                        className="history-input"
                        type="number"
                        value={Math.round(point.corY / 3)}
                        onChange={(e) =>
                          handleChangeY(index, parseInt(e.target.value) * 3)
                        }
                      />
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Tiempo = </p>
                      <input
                        className="history-input"
                        type="number"
                        value={Math.round(point.tiempo)}
                        onChange={(e) =>
                          handleChangeTiempo(index, parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Stop = </p>
                      <input
                        className="history-input"
                        type="number"
                        value={Math.round(point.stop)}
                        onChange={(e) =>
                          handleChangeStop(index, parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Direccion = </p>
                      <select
                        className="history-select"
                        type="number"
                        value={Math.round(point.direccion)}
                        onChange={(e) =>
                          handleChangeDireccion(index, parseInt(e.target.value))
                        }
                      >
                        <option value={0}>horario</option>
                        <option value={1}>antihorario</option>
                      </select>
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Angle = </p>
                      <input
                        className="history-input"
                        type="number"
                        value={Math.round(point.angle)}
                        onChange={(e) =>
                          handleChangeAngle(index, parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Recoger en la zona de construccion = </p>
                      <select
                        className="history-select"
                        type="number"
                        value={Math.round(point.recogerZonaConstruccion)}
                        onChange={(e) =>
                          handleChangeRecogerZonaConstruccion(index, parseInt(e.target.value))
                        }
                      >
                        <option value={0}>false</option>
                        <option value={1}>true</option>
                      </select>
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Soltar botes laterales = </p>
                      <select
                        className="history-select"
                        type="number"
                        value={Math.round(point.soltarLaterales)}
                        onChange={(e) =>
                          handleChangeSoltarLaterales(index, parseInt(e.target.value))
                        }
                      >
                        <option value={0}>false</option>
                        <option value={1}>true</option>
                      </select>
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Secuencia de construccion = </p>
                      <select
                        className="history-select"
                        type="number"
                        value={Math.round(point.secuenciaConstruccion)}
                        onChange={(e) =>
                          handleChangeSecuenciaConstruccion(index, parseInt(e.target.value))
                        }
                      >
                        <option value={0}>false</option>
                        <option value={1}>true</option>
                      </select>
                    </div>

                    <div className="key-value-container">
                      <p className="selected-text">Soltar todo = </p>
                      <select
                        className="history-select"
                        type="number"
                        value={Math.round(point.soltarTodo)}
                        onChange={(e) =>
                          handleChangeSoltarTodo(index, parseInt(e.target.value))
                        }
                      >
                        <option value={0}>false</option>
                        <option value={1}>true</option>
                      </select>
                    </div>

                    {/* Botón para eliminar el punto */}
                    <button onClick={() => handleDeletePoint(index)}>
                      Eliminar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
