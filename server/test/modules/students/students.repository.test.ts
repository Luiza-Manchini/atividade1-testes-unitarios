import type { Database } from "../../../src/database/connection";
import {
  PgStudentRepository,
  type Student,
} from "../../../src/modules/students/students.repository";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgStudentRepository({ query } as unknown as Database);
  });

  test("cria um aluno e usa o INSERT, RETURNING e os parametros esperados", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    const result = await repository.create({ ra: 123, name: "Ana" });

    expect(result).toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
    );
    expect(values).toEqual([123, "Ana"]);
  });

  test("lista os alunos usando as colunas e a ordenacao esperadas", async () => {
    const students: Student[] = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    query.mockResolvedValue({ rows: students });

    const result = await repository.findAll();

    expect(result).toBe(students);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0] as [string];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students ORDER BY name",
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna uma lista vazia quando nao existem alunos", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca um aluno existente pelo RA", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    const result = await repository.findOne(123);

    expect(result).toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students WHERE ra = $1",
    );
    expect(values).toEqual([123]);
  });

  test("retorna undefined quando o aluno nao existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test("propaga a mesma falha do banco ao criar", async () => {
    const error = new Error("falha ao inserir aluno");
    query.mockRejectedValue(error);

    await expect(repository.create({ ra: 123, name: "Ana" })).rejects.toBe(
      error,
    );
  });

  test("propaga a mesma falha do banco ao listar", async () => {
    const error = new Error("falha ao listar alunos");
    query.mockRejectedValue(error);

    await expect(repository.findAll()).rejects.toBe(error);
  });

  test("propaga a mesma falha do banco ao buscar", async () => {
    const error = new Error("falha ao buscar aluno");
    query.mockRejectedValue(error);

    await expect(repository.findOne(123)).rejects.toBe(error);
  });
});
