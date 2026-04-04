### Backend proyecto BDs

#### Instalar dependencias
`py -3.11 -m venv .venv` crea virtual environment con python 3.11.X
`.venv\Scripts\activate` ingresa en el virtual environment
`pip install -r requirements.txt` instala las dependencias especificadas en requirements.txt

#### Crear environment variables en powershell
```
New-Item -Path . -Name ".env" -ItemType "file"
```

#### Crear environment variables en cmd
```
echo. > .env
```

#### Contenido del .env
```
CREDENTIALS=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/DB_NAME
```

#### Ejecutar backend
```
uvicorn main:app --reload
```

#### Actualizar las dependencias
```
pip freeze > requirements.txt
```

#### Salir de *(.venv)*
`deactivate`

#### Diagramas

<img width="828" height="739" alt="imagen" src="https://github.com/user-attachments/assets/c0f8c957-e739-43bb-9824-2c25beb1acf5" />

<img width="679" height="686" alt="Postgre_ML" src="https://github.com/user-attachments/assets/152c5ef6-ed70-4195-986d-e8565dbfdb2c" />


