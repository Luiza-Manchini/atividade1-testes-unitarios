import type { Database } from "../../../src/database/connection";
import {
  PgEnrollmentRepository,
  type Enrollment,
} from "../../../src/modules/enrollments/enrollments.repository";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgEnrollmentRepository", () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgEnrollmentRepository({ query } as unknown as Database);
  });

  test("cria uma matricula com aliases, data e parametros esperados", async () => {
    const enrolledAt = new Date("2026-10-15T12:00:00.000Z");
    const enrollment: Enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValue({ rows: [enrollment] });

    const result = await repository.create(123, 7);

    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
    expect(values).toEqual([123, 7]);
  });

  test("lista matriculas com aliases, data e ordenacao esperados", async () => {
    const enrolledAt = new Date("2026-10-15T12:00:00.000Z");
    const enrollments: Enrollment[] = [
      { studentRa: 123, courseId: 7, enrolledAt },
    ];
    query.mockResolvedValue({ rows: enrollments });

    const result = await repository.findAll();

    expect(result).toEqual([
      { studentRa: 123, courseId: 7, enrolledAt },
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0] as [string];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments ORDER BY student_ra, course_id',
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna uma lista vazia quando nao existem matriculas", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca uma matricula existente pelas duas chaves", async () => {
    const enrolledAt = new Date("2026-10-15T12:00:00.000Z");
    const enrollment: Enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValue({ rows: [enrollment] });

    const result = await repository.findOne(123, 7);

    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
    expect(values).toEqual([123, 7]);
  });

  test("retorna undefined quando a matricula nao existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test("propaga a mesma falha do banco ao criar", async () => {
    const error = new Error("falha ao inserir matricula");
    query.mockRejectedValue(error);

    await expect(repository.create(123, 7)).rejects.toBe(error);
  });

  test("propaga a mesma falha do banco ao listar", async () => {
    const error = new Error("falha ao listar matriculas");
    query.mockRejectedValue(error);

    await expect(repository.findAll()).rejects.toBe(error);
  });

  test("propaga a mesma falha do banco ao buscar", async () => {
    const error = new Error("falha ao buscar matricula");
    query.mockRejectedValue(error);

    await expect(repository.findOne(123, 7)).rejects.toBe(error);
  });
});
