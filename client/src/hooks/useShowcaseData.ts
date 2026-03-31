import { useState, useEffect } from "react";

const API_BASE = "/api/showcase";

export function useTickets() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tickets`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useStats() {
  const [data, setData] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData({ open: 0, inProgress: 0, resolved: 0, pending: 0 });
        } else if (typeof responseData === "object" && !Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData({ open: 0, inProgress: 0, resolved: 0, pending: 0 });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData({ open: 0, inProgress: 0, resolved: 0, pending: 0 });
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useTicketsByPriority() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tickets-by-priority`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useTicketsByDepartment() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tickets-by-department`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useCategories() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useUsers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useCompanies() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/companies`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          setError(responseData.error);
          setData([]);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
