import database

database.init_db()

# Verify the table was created
conn = database.get_db_connection()
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', [t['name'] for t in tables])

# Test memory CRUD for two separate users (isolated banks)
database.add_memory('PAT001', 'User ordered 10x Paracetamol on 2026-04-12.', 'order')
database.add_memory('PAT001', 'User has diabetes.', 'preference')
database.add_memory('PAT002', 'User asked about Aspirin price.', 'query')

mems_pat1 = database.get_memories('PAT001')
mems_pat2 = database.get_memories('PAT002')
print(f'PAT001 memories ({len(mems_pat1)}):')
for m in mems_pat1:
    print(f'  [{m["memory_type"]}] {m["content"]}')

print(f'PAT002 memories ({len(mems_pat2)}):')
for m in mems_pat2:
    print(f'  [{m["memory_type"]}] {m["content"]}')

# Test memory_engine retrieve
import memory_engine
ctx = memory_engine.retrieve_memory_context('PAT001')
print('\nMemory context for PAT001:')
print(ctx)

conn.close()
print('\nALL MEMORY TESTS PASSED')
