import { useData } from "../DataContext";
import "./Datasets.css";

function Datasets() {

  const {
    uploadedFile,
    previewData
  } = useData();

  return (
    <div className="datasets-page">

      <div className="datasets-header">

        <div>

          <p className="datasets-eyebrow">
            DATA MANAGEMENT
          </p>

          <h1>Datasets</h1>

          <p>
            Manage and explore your uploaded datasets.
          </p>

        </div>

        <button className="upload-dataset-btn">
          + Upload Dataset
        </button>

      </div>


      {uploadedFile ? (

        <div className="datasets-grid">

          <div className="dataset-item">

            <div className="dataset-top">

              <div className="dataset-file-icon">
                FILE
              </div>

              <div>

                <h3>
                  {uploadedFile.name}
                </h3>

                <p>
                  Recently uploaded
                </p>

              </div>

            </div>


            <div className="dataset-stats">

              <div>

                <strong>
                  {previewData.length}
                </strong>

                <span>
                  Rows
                </span>

              </div>


              <div>

                <strong>
                  {previewData.length > 0
                    ? Object.keys(previewData[0]).length
                    : 0}
                </strong>

                <span>
                  Columns
                </span>

              </div>

            </div>


            <div className="dataset-buttons">

              <button>
                View
              </button>

              <button>
                Delete
              </button>

            </div>

          </div>

        </div>

      ) : (

        <div className="empty-datasets">

          <h3>
            No datasets yet
          </h3>

          <p>
            Upload a CSV or Excel file from the Dashboard.
          </p>

        </div>

      )}

    </div>
  );
}

export default Datasets;