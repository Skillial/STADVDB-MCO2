jest.mock('mysql', () => {
    return {
        createConnection: jest.fn(() => ({
            connect: jest.fn(),
            query: jest.fn(),
            end: jest.fn()
        }))
    };
});

const { insertRecord } = require('./appointmentController.js');

describe('insertRecord function', () => {
    it('should insert record into the database', async () => {
        const req = {
            body: {
                id: 1,
                startHour: '10:00',
                Status: 'Scheduled',
                Type: 'Regular',
                Virtual: false,
                Hospital: 'Hospital Name',
                City: 'City Name',
                Province: 'Province Name',
                Region: 'Region Name',
                Specialty: 'Specialty Name',
                Age: 30
            },
            cookies: {
                Central: 1
            }
        };
        const res = {};

        await insertRecord(req, res);

        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(createConnection).toHaveBeenCalledWith(DB_PORTS[0]);

        const mockConnection = createConnection.mock.results[0].value;
        expect(mockConnection.connect).toHaveBeenCalledTimes(1);

        const expectedQuery = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        expect(mockConnection.query).toHaveBeenCalledTimes(1);
        expect(mockConnection.query).toHaveBeenCalledWith(expectedQuery, [1, 'Scheduled', '10:00', 'Regular', false, 'Hospital Name', 'City Name', 'Province Name', 'Region Name', 'Specialty Name', 30], expect.any(Function));
        
        const queryCallback = mockConnection.query.mock.calls[0][2];
        queryCallback(null, 'Mock Result');

        expect(mockConnection.end).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
        const req = {
            body: {}, 
            cookies: {
                Central: 2 
            }
        };
        const res = {}; 

        await insertRecord(req, res);

        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(createConnection).toHaveBeenCalledWith(DB_PORTS[0]);

        const mockConnection = createConnection.mock.results[0].value;
        expect(mockConnection.connect).toHaveBeenCalledTimes(1);
        
        expect(mockConnection.end).toHaveBeenCalledTimes(1);
    });
});
