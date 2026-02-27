import sqlite3

conn = sqlite3.connect('pharmacy.db')
r = conn.execute("SELECT name FROM medicines WHERE name LIKE '%\u00ae%' LIMIT 5").fetchall()
print("Names with ®:", r)

if r:
    name = r[0][0]
    print("Name bytes:", name.encode('utf-8'))
    print("Test ® in name:", '\u00ae' in name)
    print("Test chr(174) in name:", chr(174) in name)

conn.close()
