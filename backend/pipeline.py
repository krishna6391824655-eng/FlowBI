import pandas as pd


# =========================================================
# STATISTICS
# =========================================================

def calculate_statistics(df):

    if df.empty:
        return {
            "rows": 0,
            "columns": 0,
            "numeric_columns": 0,
            "missing_values": 0,
            "columnStats": [],
        }

    column_stats = []

    for column in df.columns:

        values = df[column]

        missing = int(
            values.isna().sum()
        )

        unique = int(
            values.nunique(dropna=True)
        )

        non_missing = values.dropna()
        numeric_values = pd.to_numeric(
            values,
            errors="coerce"
        ).dropna()

        is_numeric = len(non_missing) > 0 and len(numeric_values) == len(non_missing)

        column_stats.append({

            "column": column,

            "type":
                "Numeric"
                if is_numeric
                else "Text",

            "missing": missing,

            "unique": unique,

            "min":
                float(numeric_values.min())
                if is_numeric
                else "-",

            "max":
                float(numeric_values.max())
                if is_numeric
                else "-",

            "mean":
                round(
                    float(numeric_values.mean()),
                    2
                )
                if is_numeric
                else "-",
        })

    numeric_column_count = 0

    for column in df.columns:

        non_missing = df[column].dropna()
        numeric_values = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if len(non_missing) > 0 and len(numeric_values) == len(non_missing):
            numeric_column_count += 1

    return {

        "rows": len(df),

        "columns": len(df.columns),

        "numeric_columns":
            numeric_column_count,

        "missing_values":
            int(
                df.isna()
                .sum()
                .sum()
            ),

        "columnStats":
            column_stats,
    }


# =========================================================
# VISUALIZATION VALIDATION
# =========================================================

def validate_visualization_config(
    df,
    chart_type,
    x_column,
    y_column,
    aggregation
):

    # -----------------------------------------------------
    # CHART TYPE
    # -----------------------------------------------------

    allowed_chart_types = [
        "bar",
        "line",
        "pie",
        "scatter",
    ]

    if chart_type not in allowed_chart_types:

        print(
            "INVALID CHART TYPE:",
            chart_type
        )

        return False

    # -----------------------------------------------------
    # X COLUMN
    # -----------------------------------------------------

    if not x_column:

        print(
            "X COLUMN IS REQUIRED"
        )

        return False

    if x_column not in df.columns:

        print(
            "INVALID X COLUMN:",
            x_column
        )

        return False

    # -----------------------------------------------------
    # Y COLUMN
    # -----------------------------------------------------

    if not y_column:

        print(
            "Y COLUMN IS REQUIRED"
        )

        return False

    if y_column not in df.columns:

        print(
            "INVALID Y COLUMN:",
            y_column
        )

        return False

    # -----------------------------------------------------
    # AGGREGATION
    # -----------------------------------------------------

    allowed_aggregations = [
        "sum",
        "average",
        "mean",
        "count",
        "min",
        "max",
    ]

    if aggregation not in allowed_aggregations:

        print(
            "INVALID AGGREGATION:",
            aggregation
        )

        return False

    # -----------------------------------------------------
    # NUMERIC Y COLUMN
    # -----------------------------------------------------

    numeric_y = pd.to_numeric(
        df[y_column],
        errors="coerce"
    )

    if not numeric_y.notna().any():

        print(
            "Y COLUMN IS NOT NUMERIC:",
            y_column
        )

        return False

    # -----------------------------------------------------
    # SCATTER X COLUMN
    # -----------------------------------------------------

    if chart_type == "scatter":

        numeric_x = pd.to_numeric(
            df[x_column],
            errors="coerce"
        )

        if not numeric_x.notna().any():

            print(
                "SCATTER X COLUMN MUST BE NUMERIC:",
                x_column
            )

            return False

    return True


# =========================================================
# VISUALIZATION
# =========================================================

def generate_visualization(
    df,
    config
):

    # -----------------------------------------------------
    # EMPTY DATA
    # -----------------------------------------------------

    if df.empty:

        print(
            "CANNOT GENERATE VISUALIZATION: EMPTY DATA"
        )

        return None

    # -----------------------------------------------------
    # CONFIGURATION
    # -----------------------------------------------------

    if not config:

        print(
            "NO VISUALIZATION CONFIG"
        )

        return None

    chart_type = config.get(
        "chart_type",
        "bar"
    )

    x_column = config.get(
        "x_column",
        ""
    )

    y_column = config.get(
        "y_column",
        ""
    )

    aggregation = config.get(
        "aggregation",
        "sum"
    )

    # -----------------------------------------------------
    # DEBUG
    # -----------------------------------------------------

    print(
        "========================================"
    )

    print(
        "VISUALIZATION CONFIG"
    )

    print(
        "Chart Type:",
        chart_type
    )

    print(
        "X Column:",
        x_column
    )

    print(
        "Y Column:",
        y_column
    )

    print(
        "Aggregation:",
        aggregation
    )

    print(
        "========================================"
    )

    # -----------------------------------------------------
    # VALIDATE CONFIG
    # -----------------------------------------------------

    is_valid = validate_visualization_config(
        df,
        chart_type,
        x_column,
        y_column,
        aggregation
    )

    if not is_valid:

        print(
            "VISUALIZATION CONFIGURATION INVALID"
        )

        return None

    # -----------------------------------------------------
    # CONVERT Y COLUMN
    # -----------------------------------------------------

    numeric_y = pd.to_numeric(
        df[y_column],
        errors="coerce"
    )

    chart_df = pd.DataFrame({

        "x": df[x_column],

        "y": numeric_y,

    })

    chart_df = chart_df.dropna(
        subset=["x", "y"]
    )

    # -----------------------------------------------------
    # CHECK VALID DATA
    # -----------------------------------------------------

    if chart_df.empty:

        print(
            "NO VALID DATA FOR VISUALIZATION"
        )

        return None

    # =====================================================
    # SCATTER CHART
    # =====================================================

    if chart_type == "scatter":

        numeric_x = pd.to_numeric(
            chart_df["x"],
            errors="coerce"
        )

        scatter_df = pd.DataFrame({

            "x": numeric_x,

            "y": chart_df["y"],

        })

        scatter_df = scatter_df.dropna()

        # Keep chart responsive
        scatter_df = scatter_df.head(100)

        data = []

        for _, row in scatter_df.iterrows():

            data.append({

                "x":
                    float(row["x"]),

                "y":
                    float(row["y"]),

            })

        visualization = {

            "chart_type":
                "scatter",

            "x_column":
                x_column,

            "y_column":
                y_column,

            "aggregation":
                None,

            "data":
                data,
        }

        print(
            "GENERATED VISUALIZATION:",
            visualization
        )

        return visualization

    # =====================================================
    # GROUP DATA
    # =====================================================

    grouped = (
        chart_df
        .groupby("x")["y"]
    )

    # =====================================================
    # AGGREGATION
    # =====================================================

    if aggregation == "sum":

        result = grouped.sum()

    elif aggregation in [
        "average",
        "mean"
    ]:

        result = grouped.mean()

    elif aggregation == "count":

        result = grouped.count()

    elif aggregation == "min":

        result = grouped.min()

    elif aggregation == "max":

        result = grouped.max()

    else:

        print(
            "INVALID AGGREGATION:",
            aggregation
        )

        return None

    # =====================================================
    # REMOVE INVALID RESULTS
    # =====================================================

    result = result.dropna()

    # =====================================================
    # LIMIT RESULTS
    # =====================================================

    result = result.head(20)

    # =====================================================
    # CREATE FRONTEND DATA
    # =====================================================

    data = []

    for category, value in result.items():

        data.append({

            "category":
                str(category),

            "value":
                float(value),

        })

    # =====================================================
    # CHECK RESULT
    # =====================================================

    if not data:

        print(
            "NO DATA GENERATED FOR CHART"
        )

        return None

    # =====================================================
    # RETURN VISUALIZATION
    # =====================================================

    visualization = {

        "chart_type":
            chart_type,

        "x_column":
            x_column,

        "y_column":
            y_column,

        "aggregation":
            aggregation,

        "data":
            data,
    }

    print(
        "GENERATED VISUALIZATION:",
        visualization
    )

    return visualization


# =========================================================
# PIPELINE ENGINE
# =========================================================

def run_pipeline(
    data,
    operations,
    visualization_config=None
):

    # -----------------------------------------------------
    # JSON DATA → DATAFRAME
    # -----------------------------------------------------

    df = pd.DataFrame(data).replace(r"^\s*$", pd.NA, regex=True)

    # -----------------------------------------------------
    # INITIAL VALUES
    # -----------------------------------------------------

    original_rows = len(df)

    duplicates_removed = 0

    missing_values_handled = 0

    statistics = None

    visualization = None

    # =====================================================
    # EXECUTE PIPELINE
    # =====================================================

    for operation in operations:

        # =================================================
        # REMOVE DUPLICATES
        # =================================================

        if operation == "remove-duplicates":

            before = len(df)

            df = (
                df
                .drop_duplicates()
                .reset_index(drop=True)
            )

            duplicates_removed += (
                before - len(df)
            )

        # =================================================
        # MISSING VALUES
        # =================================================

        elif operation == "missing-values":

            missing_before = int(
                df.isna()
                .sum()
                .sum()
            )

            for column in df.columns:

                numeric_values = pd.to_numeric(
                    df[column],
                    errors="coerce"
                )

                present_count = df[column].notna().sum()
                numeric_count = (
                    numeric_values
                    .notna()
                    .sum()
                )

                # -----------------------------------------
                # NUMERIC COLUMN
                # -----------------------------------------

                if present_count > 0 and numeric_count == present_count:

                    median = (
                        numeric_values
                        .median()
                    )

                    if pd.notna(median):

                        df[column] = (
                            numeric_values
                            .fillna(median)
                        )

                # -----------------------------------------
                # TEXT COLUMN
                # -----------------------------------------

                else:

                    if df[column].isna().any():

                        mode = (
                            df[column]
                            .mode()
                        )

                        if not mode.empty:

                            df[column] = (
                                df[column]
                                .fillna(
                                    mode.iloc[0]
                                )
                            )

            missing_after = int(df.isna().sum().sum())
            missing_values_handled += missing_before - missing_after

        # =================================================
        # STATISTICS
        # =================================================

        elif operation == "statistics":

            statistics = (
                calculate_statistics(df)
            )

        # =================================================
        # VISUALIZATION
        # =================================================

        elif operation == "visualization":

            visualization = (
                generate_visualization(
                    df,
                    visualization_config
                )
            )

            if visualization is None:
                raise ValueError("Visualization settings are invalid or there is no usable chart data.")

    # =====================================================
    # DEBUG
    # =====================================================

    print(
        "========================================"
    )

    print(
        "OPERATIONS:",
        operations
    )

    print(
        "FINAL ROWS:",
        len(df)
    )

    print(
        "DUPLICATES REMOVED:",
        duplicates_removed
    )

    print(
        "MISSING VALUES HANDLED:",
        missing_values_handled
    )

    print(
        "VISUALIZATION:",
        visualization
    )

    print(
        "========================================"
    )

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {

        "original_rows":
            original_rows,

        "final_rows":
            len(df),

        "duplicates_removed":
            duplicates_removed,

        "missing_values_handled":
            missing_values_handled,

        "statistics":
            statistics,

        "visualization":
            visualization,

        "data":
            df.to_dict(
                orient="records"
            ),
    }
