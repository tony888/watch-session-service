import json
import random
import uuid


def generate_random_timestamp():
    # Random timestamp within a range (using seconds)
    start_timestamp = 1700000000  # Example starting point (in seconds since epoch)
    end_timestamp = 1740000000  # Example ending point (in seconds since epoch)
    return (
        random.randint(start_timestamp, end_timestamp) * 1000
    )  # Convert to milliseconds


def generate_random_event():
    event_types = {
        "start": 0,
        "pause": random.randint(0, 100),
        "unpause": random.randint(0, 100),
        "progress_10": 10,
        "progress_20": 20,
        "progress_25": 25,
        "progress_30": 30,
        "progress_40": 40,
        "progress_50": 50,
        "progress_60": 60,
        "progress_70": 70,
        "progress_75": 75,
        "progress_80": 80,
        "progress_90": 90,
        "progress_95": 95,
        "complete": 100,
    }

    keys = list(event_types.keys())
    event = random.choice(keys)
    progress = event_types[event]
    return event, progress


def generate_seed_data(num_records=50):
    seed_data = []
    for _ in range(num_records):
        event, progress = generate_random_event()
        record = {
            "userId": str(uuid.uuid4()),
            "contentId": str(uuid.uuid4()),
            "progress": progress,
            "profileId": str(uuid.uuid4()),
            "mediaVideoId": str(uuid.uuid4()),
            "contentSection": random.choice(
                ["drama", "comedy", "action", "documentary"]
            ),
            "eventType": event,
            "timestamp": generate_random_timestamp(),
        }
        seed_data.append(record)
    return seed_data


# Generate 50 seed records
seed_records = generate_seed_data(50)

# Print the data in JSON format
for record in seed_records:
    print(json.dumps(record))
