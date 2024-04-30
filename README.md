# API REST LAYER Module


----
## API Definition

### **/ingestor/v1/new**
 Inserta una nueva ejecución para procesamiento y descarga de audios por parte del **Ingestor**.
* **Method:**
  `POST`
* **Data Params Required:**
  * tenant_id: String
  * audios: Array[]
* **Element Definition:** audios Array[]: 
 ```
{
  source: String    //Ruta completa para la descarga del audio
  duration: Numeric  //Duración del audio en segundos
  metadata: String   //Metada que es traspasada SIN CAMBIO hacia el transcriptor
}
```
* **Element Definition:** metadata: JSON String [Metadata JSON SCHEMA](VOC-Metadata.schema.json)
  
* **Success Response:**
  * **Code:** 200 <br />
    ```
       {
          job_id : String  //Job que identifica esta ejecución
        }
    ``` 
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->

### **/ingestor/v1/new**
 Agrega nuevos audios a una ejecución previa, para procesamiento y descarga de audios por parte del **Ingestor**.
* **Method:**
  `PATCH`
* **Data Params Required:**
  * tenant_id: String
  * job_id: String //job_id de la ejecución al cual agregar nuevos audios
  * audios: Array[]
* **Element Definition:** audios Array[]: 
 ```
{
  source: String    //Ruta completa para la descarga del audio
  duration: Numeric  //Duración del audio en segundos
  metadata: String   //Metada que es traspasada SIN CAMBIO hacia el transcriptor
}
```
* **Element Definition:** metadata: JSON String [Metadata JSON SCHEMA](VOC-Metadata.schema.json)
  
* **Success Response:**
  * **Code:** 200 <br />
    ```
       {
          job_id : String  //Job que identifica esta ejecución
        }
    ``` 
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->


### **/ingestor/v1/metadata**
 Extrae la metadata para un archivo determinado.
* **Method:**
  `GET`
* **Data Params Required:**
  * tenant_id: String
  * file_id: String
* **Success Response:**
  * **Code:** 200 <br />
      ```
       {
          metadata : String  //String con el contenido de la metada del audio consultado
        }
    ``` 
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->
    
### **/ingestor/v1/input/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio INPUT
* **Method:**
  `PATCH`
* **Data Params Required:**
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR"
* **Success Response:**
  * **Code:** 200 <br />
    <!-- **Content:** `{ id : 12 }` -->
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->

### **/ingestor/v1/converter/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio CONVERTER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR"
* **Success Response:**
  * **Code:** 200 <br />
    <!-- **Content:** `{ id : 12 }` -->
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->

    
### **/ingestor/v1/zipper/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio ZIPPER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR"
* **Success Response:**
  * **Code:** 200 <br />
    <!-- **Content:** `{ id : 12 }` -->
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->

    
### **/ingestor/v1/uploader/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio UPLOADER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR"
* **Success Response:**
  * **Code:** 200 <br />
    <!-- **Content:** `{ id : 12 }` -->
<!-- * **Error Response:**
   * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`
  * **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }` -->
