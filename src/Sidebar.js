import React from "react";
import "./Sidebar.css"; // Aquí estilizamos la barra lateral
import mover from "./assets/mover.png";
import editar from "./assets/editar.png";
import borrar from "./assets/borrar.png";
import cargar from "./assets/cargar.png";
import salvar from "./assets/salvar.png";
import uploadFile from "./assets/subir.png";

const Sidebar = ({
  isCaptureMode,
  isEditingMode,
  enableCapture,
  enableEditMode,
  handleReset,
  sendJson,
  saveJson,
  uploadJson,
}) => {
  return (
    <div className="sidebar">
      <div className="controls">
        <div className="current-mode">
          <p className="current-mode-text">Modo actual:</p>
          {isCaptureMode && <p>Movimiento</p>}
          {isEditingMode && <p>Edicion</p>}
          {!isEditingMode && !isCaptureMode && <p>Nueva linea</p>}
        </div>

        <button className="buton-sidebar" onClick={enableCapture}>
          <img src={mover} alt="icono" className="icon" />
        </button>
        <button className="buton-sidebar" onClick={enableEditMode}>
          <img src={editar} alt="icono" className="icon" />
        </button>
        <br />
        <br />
        <br />
        <button className="buton-sidebar" onClick={handleReset}>
          <img src={borrar} alt="icono" className="icon" />
        </button>
        <br />
        <br />
        <br />
        <label htmlFor="file-upload" className="input-sidebar">
          <img src={uploadFile} alt="icono" className="icon" />
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={uploadJson}
            style={{ display: 'none' }}
          />
        </label>
        <button className="buton-sidebar" onClick={saveJson}>
          <img src={salvar} alt="icono" className="icon" />
        </button>
        <br />
        <br />
        <br />
        <button className="buton-sidebar" onClick={sendJson}>
          <img src={cargar} alt="icono" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
