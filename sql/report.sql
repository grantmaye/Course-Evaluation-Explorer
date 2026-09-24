CREATE OR ALTER PROCEDURE dbo.GetEvaluationSummary
    @InstitutionId int,
    @StartDate datetime2(3),
    @EndDate datetime2(3)
AS
BEGIN
    SET NOCOUNT ON;
    IF @InstitutionId IS NULL OR @InstitutionId NOT BETWEEN 1 AND 3
       OR @StartDate IS NULL OR @EndDate IS NULL OR @StartDate >= @EndDate
        THROW 50001, 'Provide a valid institution and date range.', 1;

    SELECT CourseOfferingId AS courseOfferingId,
           COUNT_BIG(*) AS responseCount,
           SUM(CAST(Rating AS bigint)) AS ratingTotal,
           AVG(CAST(Rating AS decimal(10, 2))) AS averageRating
    FROM dbo.EvaluationResponses
    WHERE InstitutionId = @InstitutionId
      AND SubmittedAt >= @StartDate
      AND SubmittedAt < @EndDate
    GROUP BY CourseOfferingId
    ORDER BY CourseOfferingId;
END;
GO
CREATE OR ALTER PROCEDURE dbo.GetEvaluationSummaryBaseline
    @InstitutionId int,
    @Year int
AS
BEGIN
    SET NOCOUNT ON;
    IF @InstitutionId IS NULL OR @InstitutionId NOT BETWEEN 1 AND 3
       OR @Year IS NULL OR @Year NOT BETWEEN 2000 AND 2099
        THROW 50001, 'Provide a valid institution and year.', 1;

    SELECT CourseOfferingId AS courseOfferingId,
           COUNT_BIG(*) AS responseCount,
           SUM(CAST(Rating AS bigint)) AS ratingTotal,
           AVG(CAST(Rating AS decimal(10, 2))) AS averageRating
    FROM dbo.EvaluationResponses
    WHERE InstitutionId = @InstitutionId AND YEAR(SubmittedAt) = @Year
    GROUP BY CourseOfferingId
    ORDER BY CourseOfferingId;
END;
GO
