import type { Database } from "../../../src/database/connection";
import {
  PgCourseRepository,
  type Course,
} from "../../../src/modules/courses/courses.repository";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgCourseRepository({ query } as unknown as Database);
  });

  test("cria uma disciplina e usa o INSERT, RETURNING e os parametros esperados", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    const result = await repository.create({ name: "Qualidade" });

    expect(result).toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
    );
    expect(values).toEqual(["Qualidade"]);
  });

  test("lista as disciplinas usando as colunas e a ordenacao esperadas", async () => {
    const courses: Course[] = [
      { id: 1, name: "Arquitetura" },
      { id: 2, name: "Qualidade" },
    ];
    query.mockResolvedValue({ rows: courses });

    const result = await repository.findAll();

    expect(result).toBe(courses);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0] as [string];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses ORDER BY id",
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna uma lista vazia quando nao existem disciplinas", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca uma disciplina existente pelo identificador", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    const result = await repository.findOne(7);

    expect(result).toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses WHERE id = $1",
    );
    expect(values).toEqual([7]);
  });

  test("retorna undefined quando a disciplina nao existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test("propaga a mesma falha do banco ao criar", async () => {
    const error = new Error("falha ao inserir disciplina");
    query.mockRejectedValue(error);

    await expect(repository.create({ name: "Qualidade" })).rejects.toBe(error);
  });

  test("propaga a mesma falha do banco ao listar", async () => {
    const error = new Error("falha ao listar disciplinas");
    query.mockRejectedValue(error);

    await expect(repository.findAll()).rejects.toBe(error);
  });

  test("propaga a mesma falha do banco ao buscar", async () => {
    const error = new Error("falha ao buscar disciplina");
    query.mockRejectedValue(error);

    await expect(repository.findOne(7)).rejects.toBe(error);
  });
});
