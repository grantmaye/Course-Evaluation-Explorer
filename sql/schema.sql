IF OBJECT_ID('dbo.EvaluationResponses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvaluationResponses (
        ResponseId int NOT NULL PRIMARY KEY,
        InstitutionId int NOT NULL CHECK (InstitutionId BETWEEN 1 AND 3),
        CourseOfferingId int NOT NULL,
        SubmittedAt datetime2(3) NOT NULL,
        Rating tinyint NOT NULL CHECK (Rating BETWEEN 1 AND 5)
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EvaluationResponses') AND name = 'IX_Responses_Institution_Date')
    CREATE NONCLUSTERED INDEX IX_Responses_Institution_Date
    ON dbo.EvaluationResponses (InstitutionId, SubmittedAt)
    INCLUDE (CourseOfferingId, Rating);
GO
