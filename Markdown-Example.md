<style>
    table {
        width: 100%;
        border-collapse: collapse; /* optional but helps alignment */
    }

    table td:first-child,
    table th:first-child {
        width: 25%;
    }
</style>

# Title
Brief description

| Section | Description |
|---------|-------------|
| [Section Name](#section-name) | Description of Section; can have many |
| [Error Handiling](#error-handiling) | This should be in every mark down file |
| [Guide Lines](#guide-lines) | This should be in every mark down file |


## Section Name
Brief Description of what the section is. This will be linked in the table above. Use as many section as neccessary to describe the process.

### Examples and Types
Include examples in the section if applicable in correct code blocks with details on what they are doing


## Error Handiling
Description of how the error handiling is being processed. All errors should be handled by the [Server-Logger](./logger/Server-Logger.md)

### Error Codes and Descriptions

| Error Code | Description | Solution | Level |
|-|-|-|-|
| ERROR_CODE | Reason why the error occurred | Possible Solution to fix error | Warning or Error

## Guide Lines
This section so be bullets of how to develop this particular process.
- Optimized for AI Coding Agents
- Short concise detailed statements of requirements