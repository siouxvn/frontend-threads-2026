# Reseed Standard Dataset Schema

Use this prompt when `standard-dataset-v1.json` has been updated and you need the DB to reflect the new schema.

## When to use

- You edited `standard-datasets/standard-dataset-v1.json`
- The app is NOT picking up changes on restart (because `seedLatestStandardDatasetVersion` skips if version already exists)

## Steps

### 1. Stop the server (if running)

### 2. Clean seeded schema data (child → parent order)

```bash
yarn typeorm query "DELETE FROM research_dataset_form_schemas"
yarn typeorm query "DELETE FROM research_dataset_group_schemas"
yarn typeorm query "DELETE FROM research_dataset_versions"
yarn typeorm query "DELETE FROM dataset_versions WHERE is_standard = true"
```

### 3. Restart server

```bash
yarn start:dev
```

On bootstrap, `ResearchStartupService` will:

- Skip `seedStandardResearch` (already exists)
- **Re-create** `dataset_versions` from the updated JSON file
- **Re-create** `research_dataset_versions`, `research_dataset_group_schemas`, `research_dataset_form_schemas`

### 4. Verify in logs

Look for:

```
[seedLatestStandardDatasetVersion] Created standard dataset version: X
```

## Notes

- `research_patients` and `research_patient_form_values` data are **not affected**
- Do **not** delete `researches` table — standard research is reused as-is
- If the JSON `version` field was not bumped, the seeder will still skip. In that case bump `version` in the JSON or delete `dataset_versions` row manually
